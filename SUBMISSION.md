# Chrome Web Store submission pack — AEO Schema Scanner

Everything to submit the extension. Copy fields straight into the Developer Dashboard. Step 4 walks the actual clicks; this is the content.

---

## 0. Before you start (prerequisites)

1. **Developer account** — register at the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole). One-time **$5 USD** verification fee, paid once per account.
2. **Privacy policy must be live** — publish `https://www.laurelinlabs.com/privacy/aeo-schema-scanner` (draft is in `HANDOFF.md`). The listing won't pass review without a reachable privacy URL, because the extension collects an email via the form.
3. **Set the lead endpoint** — in `popup.js`, set `CONFIG.endpoint` to your Formspree/webhook URL so submissions are captured (otherwise it falls back to a pre-filled email). Re-zip after any change.
4. **Upload package** — use `store-assets/aeo-schema-scanner-store.zip` (manifest.json is at the zip root, as required).

---

## 1. Package & assets (in `store-assets/`)

| Asset | File | Spec | Status |
|-------|------|------|--------|
| Extension ZIP | `aeo-schema-scanner-store.zip` | manifest at root | ✅ ready |
| Store icon | `../icons/icon128.png` | 128×128 PNG | ✅ ready |
| Screenshot 1 | `store-screenshot-1.png` | 1280×800 PNG | ✅ ready |
| Small promo tile | `store-promo-small.png` | 440×280 PNG | ✅ ready |
| Marquee promo tile | `store-marquee.png` | 1400×560 PNG | ✅ optional |

You need **at least one** screenshot (have it). Promo tiles are optional but recommended; the small tile helps if the extension is ever featured.

---

## 2. Listing copy (paste into "Store listing")

**Item name**
```
Laurelin Labs — AEO Schema Scanner
```

**Summary** (max 132 chars)
```
Scan any page's structured data and see what's present, deprecated, or missing for AI search visibility. On-device and private.
```

**Description**
```
AEO Schema Scanner reads the structured data on any web page and tells you three things in one click: what schema is present, what Google has deprecated or demoted, and what's missing to be the trusted answer in AI search.

Structured data has moved from an SEO nicety to how an AI answer engine decides what a page is, who is behind it, and whether it can be cited. Most sites can't see what they're emitting — or that some of it is now dead weight.

What it shows:
• Detected — every schema.org type found in JSON-LD and microdata, with the source.
• Deprecated / at-risk — FAQ (rich result removed 2026), HowTo (demoted), data-vocabulary.org, and microdata-only pages.
• Missing (recommended) — the corporate-AEO baseline for the page type: Organization, WebSite, BreadcrumbList, Person, Article.
• Entity completeness — warns when an Organization or Person lacks @id, sameAs, logo, knowsAbout, jobTitle or worksFor.

Privacy by design:
The scan runs entirely on your device. Nothing about the pages you analyse is ever sent anywhere — no server, no analytics, no tracking. The extension uses only the activeTab and scripting permissions, so nothing runs until you click, and it cannot watch your browsing. The only data it ever sends is what you choose to type into the optional contact form.

For SEO, content and comms teams working on AI search visibility and entity authority.

Open source: https://github.com/PIE-AI-cmd/aeo-schema-scanner
Built by Laurelin Labs. Not affiliated with Google or Schema.org.
```

**Category:** Developer Tools
**Language:** English (United Kingdom)

---

## 3. Privacy practices tab (the part reviewers scrutinise)

**Single purpose** (one sentence)
```
Analyse the structured data of the page the user is viewing and report what is present, deprecated, or missing for search and AI-answer visibility.
```

**Permission justifications** (one per permission in the manifest)

- **activeTab**
```
Used to read the structured data of the page the user is actively viewing, and only at the moment they click the extension icon. It grants no background or cross-site access.
```
- **scripting**
```
Used to inject a single, read-only script into the active tab that extracts the page's existing structured data (JSON-LD and microdata) and returns it to the popup for analysis. It runs only in response to a user click and writes nothing to the page.
```
- **storage**
```
Used to keep a local backup of the user's own contact-form submissions in chrome.storage.local. No browsing or page-scan data is stored.
```

**Host permissions:** none requested.
**Remote code:** No — the extension contains no remote or externally hosted code; all logic ships in the package.

**Data usage — what the extension collects**

Tick **Personally identifiable information** (name, email address). In the notes, add:
```
The extension collects data only when a user voluntarily submits the in-extension contact form: their name (optional), email address, selected interest (consultancy / newsletter), and the URL of the page they were viewing. This is used solely to respond to the enquiry or send the requested newsletter.

The structured-data analysis is performed entirely on the user's device and is never collected, transmitted, or shared. The extension has no server, analytics, or telemetry.
```

Do **not** tick: health, financial/payment, authentication, personal communications, location, web history. (The page scan stays on-device, so it is not "collected".)

**Three required certifications — you can check all three:**
- ✅ I do not sell or transfer user data to third parties, outside of approved use cases.
- ✅ I do not use or transfer user data for purposes unrelated to the item's single purpose.
- ✅ I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL**
```
https://www.laurelinlabs.com/privacy/aeo-schema-scanner
```

---

## 4. Distribution settings

- **Visibility:** Public (or Unlisted if you want to soft-launch and share the link first).
- **Pricing:** Free.
- **Regions:** All regions.

---

## 5. What to expect

- Review typically takes a few hours to a few business days. Extensions with narrow permissions and an accurate privacy tab (this one) usually clear quickly.
- If rejected, the email names the exact policy — almost always a privacy-tab mismatch or a permission justification. Fixes are quick; you resubmit the same listing.
- After it's live: copy the store URL into the blog post's "Add to Chrome" button (currently a placeholder) and the GitHub README.
