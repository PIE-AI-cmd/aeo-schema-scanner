# Laurelin Labs — AEO Schema Scanner (Chrome extension)

Scans the page you're on and shows:

- **Detected structured data** — every schema.org type found in JSON-LD and microdata, with the source.
- **Deprecated / at-risk** — types Google has dropped or demoted (FAQPage, HowTo, PracticeProblem, `data-vocabulary.org`), and a flag if the page uses microdata only.
- **Missing (recommended)** — the corporate-AEO baseline (Organization, WebSite, BreadcrumbList, Person, Article) it expects for this page type, with the reason each matters.
- **Entity completeness** — warns when an Organization or Person is present but missing key entity properties (`@id`, `sameAs`, `logo`, `knowsAbout`, `jobTitle`, `worksFor`).
- **Lead capture** — a consultancy / newsletter form.

This is the in-browser companion to the `aeo-corporate` skill and the Entity Authority & Narrative Coherence Index.

## Install (load unpacked)

1. Go to `chrome://extensions` (or `edge://extensions`).
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select this `aeo-schema-scanner` folder.
4. Pin the flask icon to the toolbar. Click it on any page to scan.

## Wire up the lead form

Open `popup.js` and set `CONFIG.endpoint` to a JSON-accepting webhook — e.g. a [Formspree](https://formspree.io) form URL, a Zapier/Make webhook, or your own endpoint:

```js
const CONFIG = {
  endpoint: "https://formspree.io/f/xxxxxx",   // <- paste yours
  contactEmail: "piers@laurelinlabs.com",
  site: "https://laurelinlabs.com"
};
```

- **With an endpoint:** submissions POST as JSON `{name, email, interest, page, source, ts}`.
- **Without one (default):** the form opens a pre-filled email to `contactEmail`.
- Every submission is also saved locally to `chrome.storage.local` (`leads`) as a backup.

## How the logic works

- The popup injects a scanner into the active tab (`activeTab` + `scripting` permissions only — no broad host access, nothing runs until you click).
- It parses every `<script type="application/ld+json">` (including `@graph` and arrays), plus microdata `itemtype`s.
- Recommendations are **context-aware** (homepage vs article vs about/leadership page) and intentionally conservative — they reflect the Laurelin corporate-AEO baseline, not every possible type.

## Notes / roadmap

- Deprecation notes are current to **2026** (Google dropped FAQ rich results May 2026; HowTo demoted March 2026).
- Recommendation heuristics are deliberately simple; a future version could pull the page's `og:type`/CMS signals for sharper page-type detection and add a "copy JSON-LD starter" button per missing type.
- Built by Laurelin Labs. Company No. 16724815.
