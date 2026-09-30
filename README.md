# SOC 2 Readiness Calculator

A free, browser-based self-assessment that estimates your readiness for a SOC 2 examination against the AICPA Trust Services Criteria. No backend. Your answers stay in your browser (localStorage). Works offline from `file://` or any static host.

Live: https://nehemiah313.github.io/soc2-readiness-calculator/

## What it does

- **Scope selector.** Security (the Common Criteria) is always in scope, locked on. Toggle Availability, Processing Integrity, Confidentiality, and Privacy to match your engagement.
- **Criterion-by-criterion assessment.** Each of the 61 criteria shows its plain-English summary and typical evidence. Mark each Implemented, Partial, Not implemented, or N/A.
- **Readiness score.** Percentage of applicable criteria implemented (partial counts as half, N/A excluded), with per-category and per-series breakdowns. SOC 2 has no official numeric score, so this is a readiness estimate, not an audit result.
- **Fix-first list.** Critical-priority gaps (access controls and system operations) surfaced first, then high-priority gaps.
- **Exports.** Download a Markdown summary report or a CSV of your answers. A "Get your report reviewed" lead-capture form sends results to AI Tech Pros via FormSubmit when a report inbox is configured (see below).
- **Search and progress.** Filter criteria by keyword, expand/collapse series groups, per-series progress chips.

## Data

Criteria come from `data/tsc.json`, copied from [tsc-dataset](https://github.com/nehemiah313/tsc-dataset): 61 criteria verified against the AICPA 2017 Trust Services Criteria (TSP Section 100), with 2022 revised points of focus. The dataset is embedded in `app.js` at build time so the app works from `file://` with no network requests. Summaries are original plain-English guidance, not AICPA text.

## Lead capture

At the top of `app.js`:

```js
const REPORT_INBOX = "n.harvard@aitechpros.ai";
```

When set, a "Get your report reviewed" form appears under the exports. The visitor enters their work email; their results are posted to FormSubmit (`https://formsubmit.co/ajax/<inbox>`), which emails the full report plus lead details (company, email, readiness score, gap counts) to the inbox. The visitor's email is remembered in localStorage (`soc2lead`) so returning visitors do not retype it. Set the constant to `""` to hide the form entirely.

One-time setup: the first submission triggers a FormSubmit activation email to the inbox. Click the activation link once; submissions arrive automatically after that.

Privacy copy on the page states the results are sent to AI Tech Pros for follow-up and that the address is never sold.

## Rebuild the embedded dataset

If `data/tsc.json` changes, re-embed it into `app.js`:

```bash
cd ~/workspace/soc2-readiness-calculator
python3 tools/embed.py
```

## Disclaimer

Readiness aid only. Not an audit, attestation, CPA opinion, or legal advice. SOC 2 examinations are performed by licensed CPA firms.

## License

MIT. See LICENSE.
