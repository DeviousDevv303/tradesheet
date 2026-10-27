# TradeSheet

A 5-minute guided intake that turns a trades worker's skills, certifications and job history into a clean, one-page,
agency-ready resume (PDF), on the worker's own phone. **Your information never leaves your phone.**

Status: **v1, built and tested in an emulator; not yet tested on a real phone or by a real worker.** See `ACCEPTANCE.md`.

## What makes the privacy promise literal (not a promise)
- A static page with **no server, no account, no analytics, no font service**. Everything it loads is in this repo.
- The page's Content-Security-Policy sets `connect-src 'none'`: the browser itself refuses any request from the page to anywhere.
  The end-to-end test proves it by trying a `fetch()` and checking it is blocked.
- The PDF is generated on the device (`vendor/pdf-lib`). Nothing is uploaded to make it.

## Two modes
- **Worker's phone (default).** The profile is saved in this browser so the worker can come back. They can turn saving off,
  save the profile as a file and load it back (iPhone can delete site data after about a week without visits), or run
  **Clear my data**, which removes every TradeSheet key and confirms by reading storage back.
- **Agency tablet: `?mode=assist`.** Nothing is ever written to storage. The welcome screen shows a **QR code that opens the app
  on the worker's own phone**; the code carries only the app's address, no data. Inactivity for 10 minutes clears the screen.

## Output
One page, single column, real text in standard fonts, standard section headings (Certifications & Licenses first, with expiry
dates; expired cards are listed last and labelled expired), work experience newest first, availability, references.
**English by default**, Spanish on a tap. Pick-list duty bullets carry both translations, so a Spanish intake makes a correct
English resume. Lines the worker types are kept as typed (the app says so).
A very long profile shrinks the type to fit one page; if it still cannot fit, it goes to a second page and the app says so.
Nothing is silently cut.

## Profile file (versioned from day one)
`{ "format": "tradesheet-profile", "schemaVersion": 1, "exportedAt": …, "profile": { … } }`. A file from a newer version is
refused, never guessed at; older versions are migrated step by step through `MIGRATIONS` in `src/schema.js` (a test fails if a
version bump lands without its migration). This is the v2 path for cert reminders.

## Run and test
```
npm run serve          # http://localhost:8080 (any static server works)
npm test               # unit + ATS-parse tests (needs poppler-utils: pdftotext, pdfinfo, pdffonts, pdfimages)
npm run e2e            # real Chromium on a phone-sized screen (needs Playwright + Chromium)
```
No runtime dependencies to install; `vendor/` holds the two self-hosted libraries (MIT, see `LICENSES-THIRD-PARTY.md`).

## Layout
`index.html` (CSP) · `styles.css` · `src/app.js` (intake UI) · `src/catalog.js` (trades, bilingual bullets, certs) ·
`src/i18n.js` · `src/schema.js` (versioned profile) · `src/resume.js` (profile → resume text) · `src/pdf.js` (resume → PDF) ·
`src/storage.js` (personal/assist modes, clear ritual) · `src/qr.js` · `test/` · `e2e/`.

## Not done / not verified
- Not run on a real iPhone or Android phone yet; the iOS download and share flow in particular is untested.
- "ATS parse" is tested with poppler's extractor as a stand-in; no commercial applicant-tracking system has read these PDFs.
- Fonts are the PDF standard Helvetica, not embedded (every reader supplies them; PDF/A archiving would need embedding).
- No real worker or agency has used it. Hosting (GitHub Pages) is not set up by this commit.
- No licence file: the owner decides how this code may be used.
