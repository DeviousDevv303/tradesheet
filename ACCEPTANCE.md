# TradeSheet v1 acceptance

## 1. ATS parse test (automated; must pass on every change)
`npm test` builds the resume PDF from a FICTIONAL profile (`test/fixtures/sample-profile.json`) in English and Spanish and reads it back
with an independent parser (poppler):
- exactly **one page** (`pdfinfo`); **real text** in standard fonts only (`pdffonts`: Helvetica / Helvetica-Bold, WinAnsi); **no images** (`pdfimages`);
- **every line extracted, in reading order** (name, contact, headings, certs, jobs, bullets, availability, references); accents intact (ñ, á, ó);
- **single column**: no side-by-side text in `pdftotext -layout`;
- the standard headings an ATS looks for: CERTIFICATIONS & LICENSES, WORK EXPERIENCE, AVAILABILITY, REFERENCES;
- a too-long profile is never cut off; unsupported characters (emoji) never break the PDF.

## 2. The 5-minute self-test (Cristian, on his own phone, with his own work history)
1. Open `https://deviousdevv303.github.io/tradesheet/` on your phone (after the one Pages setting in README → Hosting). Do not prepare anything first.
2. Tap **Start**: the clock starts. Enter your real contact info, trades, certs with expiry months, every job you want on it, availability, references.
3. On the last screen the app shows **"Finished in m:ss"**. **Pass: 5:00 or less.** Write the time down.
4. Download the PDF (English, the default). Pass: one page; reads right to you as an agency would read it; certs at the top with correct dates.
5. Switch the resume to Spanish and download again. Pass: headings and picked bullets are Spanish; what you typed is unchanged.
6. **Save my info as a file**, then **Clear my data**, then **Load my info from a file**. Pass: everything comes back.
7. Note anything slow or confusing, and which phone and browser you used.

| Date | Phone / browser | Time | One page? | Reads right? | Notes |
|---|---|---|---|---|---|
| | | | | | |

## 3. Agency tablet check
Open with `?mode=assist` on a tablet. Pass: the banner says nothing is saved; the QR code opens the app on a phone (and shows only the address);
after **Clear my data** nothing is left; storage stays empty throughout (the e2e test checks this automatically).

## 4. Before any v2 talk
3–5 real agency workers complete it, with feedback collected; one agency contact willing to hand it to walk-ins.
