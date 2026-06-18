"use strict";

/* ============================================================
   CONFIG — set your lead endpoint here.
   Paste a Formspree / Zapier / webhook URL that accepts a JSON POST.
   Leave blank to fall back to a pre-filled email (mailto).
   ============================================================ */
const CONFIG = {
  endpoint: "",                       // e.g. "https://formspree.io/f/xxxxxx"
  contactEmail: "piers@laurelinlabs.com",
  site: "https://laurelinlabs.com"
};

/* ---------- reference data ---------- */
// Deprecated / at-risk schema types (keyed lowercase). Sources: Google Search Central, 2026.
const DEPRECATED = {
  faqpage: { sev: "warn", label: "FAQPage",
    note: "Google removed FAQ rich results in Search (May 2026). Still valid and useful for AEO/LLMs, but it no longer earns a Search feature — keep only on genuine Q&A content." },
  howto: { sev: "warn", label: "HowTo",
    note: "HowTo rich results were demoted (March 2026 core update). Now an AI trust signal only, not a SERP feature." },
  practiceproblem: { sev: "bad", label: "PracticeProblem",
    note: "Google removed Search Console + Rich Results support (Jan 2026)." }
};

// Recommended baseline for a corporate / entity-authority page (Laurelin AEO framework).
function recommendedFor(signals, presentLower) {
  const recs = [];
  const has = (t) => presentLower.includes(t.toLowerCase());
  recs.push({ type: "Organization", why: "Core brand entity — feeds the Knowledge Graph and disambiguates the company.", need: !["organization","corporation","ngo","localbusiness"].some(has) });
  recs.push({ type: "WebSite", why: "Names the site as an entity; supports identity and sitelinks.", need: !has("website") });
  if (signals.depth >= 1)
    recs.push({ type: "BreadcrumbList", why: "Still a live Google rich result; clarifies site structure.", need: !has("breadcrumblist") });
  if (signals.aboutish || signals.isArticle)
    recs.push({ type: "Person", why: "Make leaders/authors citable entities (jobTitle, sameAs, knowsAbout).", need: !has("person") });
  if (signals.isArticle)
    recs.push({ type: "Article / NewsArticle", why: "Bind content to author + publisher entities, with dates.", need: !["article","newsarticle","blogposting"].some(has) });
  return recs.filter(r => r.need);
}

const ORG_PROPS = { "@id":"stable @id", "sameAs":"sameAs (Wikidata, LinkedIn…)", "logo":"logo", "knowsAbout":"knowsAbout (topics)" };
const PERSON_PROPS = { "sameAs":"sameAs (Wikidata, LinkedIn)", "jobTitle":"jobTitle", "knowsAbout":"knowsAbout (expertise)", "worksFor":"worksFor (→ Organization)" };

/* ---------- the injected scanner (runs in the page) ---------- */
function scanPage() {
  function collectTypes(obj, acc) {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) { obj.forEach(o => collectTypes(o, acc)); return; }
    if (obj["@type"]) { const t = obj["@type"]; (Array.isArray(t) ? t : [t]).forEach(x => acc.push(String(x))); }
    Object.keys(obj).forEach(k => { if (k !== "@type") collectTypes(obj[k], acc); });
  }
  let jsonld = [], orgNodes = [], personNodes = [];
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  scripts.forEach(s => {
    try {
      const data = JSON.parse((s.textContent || "").trim());
      const arr = Array.isArray(data) ? data : (data["@graph"] ? data["@graph"] : [data]);
      arr.forEach(node => {
        if (!node || typeof node !== "object") return;
        const acc = []; collectTypes(node, acc); jsonld = jsonld.concat(acc);
        const t = node["@type"]; const ts = Array.isArray(t) ? t : [t];
        ts.forEach(tt => {
          if (tt && /Organization|Corporation|NGO|LocalBusiness/i.test(tt)) orgNodes.push(Object.keys(node));
          if (tt === "Person") personNodes.push(Object.keys(node));
        });
      });
    } catch (e) { /* malformed JSON-LD ignored */ }
  });
  let micro = [], usesDataVocab = false;
  document.querySelectorAll("[itemscope][itemtype]").forEach(el => {
    const it = el.getAttribute("itemtype") || "";
    if (/data-vocabulary\.org/i.test(it)) usesDataVocab = true;
    const name = it.split(/[\/#]/).filter(Boolean).pop();
    if (name) micro.push(name);
  });
  const path = (location.pathname || "/");
  const depth = path.split("/").filter(Boolean).length;
  const ogType = (document.querySelector('meta[property="og:type"]') || {}).content || "";
  const isArticle = !!document.querySelector("article") || /article/i.test(ogType) ||
    /Article|BlogPosting|NewsArticle/.test(jsonld.join(","));
  const txt = (document.body && document.body.innerText || "").toLowerCase();
  const hasQA = /(faq|frequently asked|q&a)/.test(txt);
  const aboutish = /(about|team|leadership|board|management|people|author|profile|investor)/.test(path.toLowerCase());
  return {
    url: location.href,
    jsonldTypes: Array.from(new Set(jsonld)),
    microTypes: Array.from(new Set(micro)),
    usesDataVocab,
    orgKeys: Array.from(new Set([].concat.apply([], orgNodes))),
    personKeys: Array.from(new Set([].concat.apply([], personNodes))),
    hasOrg: orgNodes.length > 0,
    hasPerson: personNodes.length > 0,
    signals: { isHome: depth === 0, depth, isArticle, hasQA, aboutish },
    counts: { jsonldBlocks: scripts.length }
  };
}

/* ---------- render helpers ---------- */
function el(html) { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

function render(data) {
  const present = [].concat(data.jsonldTypes, data.microTypes);
  const presentLower = present.map(t => t.toLowerCase());
  const results = document.getElementById("results");
  results.innerHTML = "";

  // deprecated / at-risk
  const dep = [];
  Object.keys(DEPRECATED).forEach(k => { if (presentLower.includes(k)) dep.push(DEPRECATED[k]); });
  if (data.usesDataVocab) dep.push({ sev: "bad", label: "data-vocabulary.org",
    note: "Uses data-vocabulary.org markup — fully deprecated by Google since 2020. Migrate to schema.org JSON-LD." });
  if (data.counts.jsonldBlocks === 0 && data.microTypes.length > 0)
    dep.push({ sev: "warn", label: "Microdata only",
      note: "No JSON-LD found. Google recommends JSON-LD as the primary format — microdata is harder to maintain and parse." });

  // missing recommended
  const missing = recommendedFor(data.signals, presentLower);

  // entity property warnings
  const propWarn = [];
  if (data.hasOrg) {
    Object.keys(ORG_PROPS).forEach(p => { if (!data.orgKeys.includes(p)) propWarn.push("Organization missing " + ORG_PROPS[p]); });
  }
  if (data.hasPerson) {
    Object.keys(PERSON_PROPS).forEach(p => { if (!data.personKeys.includes(p)) propWarn.push("Person missing " + PERSON_PROPS[p]); });
  }

  // summary chips
  const sum = document.getElementById("summary");
  sum.innerHTML =
    `<span class="chip ok">Detected <b>${present.length}</b></span>` +
    `<span class="chip ${dep.length ? "warn" : "ok"}">Deprecated / at-risk <b>${dep.length}</b></span>` +
    `<span class="chip ${missing.length ? "bad" : "ok"}">Missing <b>${missing.length}</b></span>`;

  // detected
  let h = `<div class="block"><h3><span class="pip" style="background:var(--ok)"></span>Detected structured data</h3>`;
  if (present.length) {
    const jl = data.jsonldTypes.map(t => `<span class="tg">${esc(t)} <span style="color:#7a9a5c">JSON-LD</span></span>`).join("");
    const md = data.microTypes.map(t => `<span class="tg">${esc(t)} <span style="color:#7a9a5c">microdata</span></span>`).join("");
    h += `<div class="item ok"><div class="tagline">${jl}${md}</div>` +
         `<div class="note">${data.counts.jsonldBlocks} JSON-LD block(s) on the page.</div></div>`;
  } else {
    h += `<div class="item bad"><div class="t">No structured data found</div>` +
         `<div class="note">This page emits no JSON-LD or microdata an answer engine can read. Start with Organization + WebSite.</div></div>`;
  }
  h += `</div>`;

  // deprecated
  h += `<div class="block"><h3><span class="pip" style="background:var(--warn)"></span>Deprecated / at-risk</h3>`;
  if (dep.length) {
    dep.forEach(d => { h += `<div class="item ${d.sev}"><span class="t">${esc(d.label)}</span><div class="note">${esc(d.note)}</div></div>`; });
  } else { h += `<div class="empty">None found — nothing deprecated in use.</div>`; }
  h += `</div>`;

  // missing
  h += `<div class="block"><h3><span class="pip" style="background:var(--leaf)"></span>Missing (recommended)</h3>`;
  if (missing.length) {
    missing.forEach(m => { h += `<div class="item miss"><span class="t">${esc(m.type)}</span><div class="note">${esc(m.why)}</div></div>`; });
  } else { h += `<div class="empty">The recommended baseline for this page type is present.</div>`; }
  h += `</div>`;

  // entity quality
  if (propWarn.length) {
    h += `<div class="block"><h3><span class="pip" style="background:var(--warn)"></span>Entity completeness</h3>`;
    h += `<div class="item warn"><div class="note">${propWarn.map(esc).join("<br>")}</div></div></div>`;
  }

  results.innerHTML = h;
}

/* ---------- lead capture ---------- */
function initLeadForm(pageUrl) {
  const form = document.getElementById("leadForm");
  const msg = document.getElementById("leadMsg");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("lname").value.trim();
    const email = document.getElementById("lemail").value.trim();
    const consult = document.getElementById("optConsult").checked;
    const news = document.getElementById("optNews").checked;
    if (!email) { msg.className = "leadmsg err"; msg.textContent = "Please add an email."; return; }
    const interest = [consult ? "Consultancy review" : null, news ? "Newsletter" : null].filter(Boolean).join(" + ") || "General";
    const payload = { name, email, interest, page: pageUrl, source: "AEO Schema Scanner", ts: new Date().toISOString() };

    // always keep a local record
    try { chrome.storage.local.get({ leads: [] }, (o) => { o.leads.push(payload); chrome.storage.local.set({ leads: o.leads }); }); } catch (e) {}

    if (CONFIG.endpoint) {
      try {
        const r = await fetch(CONFIG.endpoint, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(payload) });
        if (r.ok) { done(); return; }
        throw new Error("bad status");
      } catch (err) { mailtoFallback(payload); return; }
    } else {
      mailtoFallback(payload);
    }
    function done() { form.reset(); msg.className = "leadmsg good"; msg.textContent = "Thanks — we'll be in touch."; }
    function mailtoFallback(p) {
      const subject = encodeURIComponent("AEO enquiry — " + p.interest);
      const body = encodeURIComponent(
        `Name: ${p.name}\nEmail: ${p.email}\nInterest: ${p.interest}\nPage: ${p.page}\n\n(Sent from the Laurelin AEO Schema Scanner)`);
      try { chrome.tabs.create({ url: `mailto:${CONFIG.contactEmail}?subject=${subject}&body=${body}` }); } catch (e) {
        window.open(`mailto:${CONFIG.contactEmail}?subject=${subject}&body=${body}`);
      }
      done();
    }
  });
}

/* ---------- boot ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("siteLink").href = CONFIG.site;
  let tab;
  try { [tab] = await chrome.tabs.query({ active: true, currentWindow: true }); } catch (e) {}
  const urlEl = document.getElementById("pageurl");
  initLeadForm(tab ? tab.url : "");

  if (!tab || !tab.id || /^(chrome|edge|about|chrome-extension|https:\/\/chrome\.google\.com\/webstore)/.test(tab.url || "")) {
    urlEl.textContent = "Open a normal website to scan it.";
    document.getElementById("results").innerHTML = `<div class="item bad"><div class="note">This is a browser/internal page and can't be scanned. Navigate to a website and reopen the scanner.</div></div>`;
    return;
  }
  urlEl.textContent = tab.url;
  try {
    const res = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: scanPage });
    const data = res && res[0] && res[0].result;
    if (data) render(data);
    else throw new Error("no result");
  } catch (err) {
    document.getElementById("results").innerHTML = `<div class="item bad"><div class="note">Couldn't read this page (${esc(String(err.message || err))}). Some sites block extension scripts.</div></div>`;
  }
});
