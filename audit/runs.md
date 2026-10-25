# Audit runs

One dated section per run. Batch 1 (34 charts) is in report-2026-10-batch1.md.

## 2026-10-25 — batch 2 (scheduled run, v1.5.1)

7 verified, 0 flagged, 1 skipped. The built-in browser (desktop app) went offline partway through Free People, so that brand was skipped.

| Brand | Outcome | What changed | Official URL |
|---|---|---|---|
| & Other Stories (W) | verified | Estimated XS–XL letter rows (with invented US sizes) replaced by the official EU 32–44 chart: e.g. EU 36 chest 84 / waist 68 / hip 92 (old S was 86/66/91). UK only per letter (XS = UK 4-6 … L = UK 16), no US, no XL. | https://www.stories.com/en-gb/customer-service/size-guide/ |
| Abercrombie & Fitch (W) | verified | Official UK tops chart gives chest only, as cm ranges, XXS–XXXL. Waist/hips/US/EU removed. UK mapping fixed: XXS UK 6 → 4-6, L UK 14 → 14-16, XL UK 16 → 18-20; M bust 92 → 90–97. | https://www.abercrombie.com/shop/uk/p/equestrian-skimming-tee-63718427-1005 (Size Guide) |
| AllSaints (W) | verified | Small fixes throughout: UK 8 bust 85 → 84.5, hips 92 → 93; UK 16 bust 105 → 104.5, hips 112 → 113. | https://www.allsaints.com/sizeguide.html |
| Arket (W) | verified | Old one-EU-per-letter mapping was wrong. Official: XS = EU 32–34 / UK 4–6 … L = EU 44–46 / UK 16, with ranges (M chest 92–96, waist 76–80, hip 100–104; old M was 90/72/95). No XL/XXL or US. | https://www.arket.com/en-gb/customer-service/size-guide/women/ |
| Boohoo (W) | verified | Small sizes were 2–5 cm low: UK 4 bust 75 → 80, waist 57 → 62, hips 81 → 88; UK 12 bust 91 → 95. Extended from UK 20 to UK 32. UK 32 US/EU left out (the site repeats the UK 30 conversions). | https://www.boohoo.com/pages/informational/size-guide |
| Coast (W) | verified | Letter rows XS–XXL replaced by the official numeric UK 4–24 chart: UK 12 bust 90 → 95, waist 70 → 77, hips 95 → 103. The site moved to coastfashion.com. | https://www.coastfashion.com/pages/informational/size-guide |
| Fred Perry (W) | verified | UK 6–12 correct. UK 14 bust 96 → 98, waist 78 → 80, hips 102 → 104; UK 16 bust 100 → 104, waist 82 → 86, hips 106 → 110. | https://www.fredperry.com/size-guides/womens |
| Free People (W) | skipped | The browser went offline before the UK guide was found (/en-gb/help/size-guide/ is now a 404). Retry next run. | — |

Notes: Arket and A&F notes text updated to match the official charts. boohoo-w and fredperry-w had an unindented `],` closing their sizes block, which apply.py couldn't match; it was re-indented (whitespace only). Checks: build OK, verify.mjs 0 failures (360 rows / 41 entries), api tests 21 passed.
