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

## 2026-10-26 — batch 3 (scheduled run, v1.5.2)

8 queue entries (Gymshark → Lacoste) plus a retry of Free People, skipped on 2026-10-25. Pages were read in the built-in browser on the brands' own sites. Optional cookies were rejected where a banner appeared, and there were no sign-ins. Result: 6 verified (incl. Free People), 2 flagged, 1 skipped.

| Brand | Outcome | What changed | Official URL |
|---|---|---|---|
| Free People (W) (retry) | verified | Whole UK mapping was shifted: XS UK 8 → UK 4–6, S 10 → 8–10, XL 16 → 20; bust M 92 → 94–96.5. Uses the tops chart, which has bust and natural waist only, so hips removed. XXS (UK 2) added. The dresses chart differs at L/XL (bust 100–104 / 108) and is not mixed in. | https://www.freepeople.com/uk/shop/rosalie-solid-tee/ (Size Guide, UK view) |
| Gymshark (W) | verified | No number changes; the stored chart already matched. Hips taken from the bottoms chart, which has the same waist figures. Gymshark's bottoms chart gives US one step higher than tops; the tops US is kept. | https://support.gymshark.com/en/articles/11204065-women-s-size-guide |
| Hobbs (W) | verified | Site moved to hobbs.com. UK 16 bust 104 → 107, UK 20 bust 114 → 119, waist 96 → 101; UK 22 added; letter sizes from Hobbs' S-M-L chart. Hobbs' inch table has a UK 20 waist (42.1 in) that disagrees with its cm table, so the cm table is used. | https://www.hobbs.com/size-guide.html |
| Hollister (W) | skipped | hollisterco.com/shop/uk pages never finished loading (blank body), even after several tries. Retry next run. | — |
| Hugo Boss (W) | flagged | Only a size conversion is published, with no body measurements. The official conversion puts XS = UK 6 (stored: UK 8). Stored numbers are unchanged. | https://www.hugoboss.com/uk/size-charts/womenswear-clothing/size-chart_BOSS_ptw1.html |
| Jack Wills (W) | flagged | The help-centre size guide is empty. Product pages (Frasers platform) show a generic multi-brand "Mens tops" chart even on women's items. Stored numbers are unchanged. | https://help.jackwills.com/hc/en-gb/articles/6018354804639-Size-Guide |
| Jigsaw (W) | verified | Guide moved to /pages/size-guide. Inches only, ×2.54. Rows are now UK 6–18 (old XS = UK 8 letter rows); e.g. UK 14 bust 95 → 99.1. US/EU and letter sizes removed: the letter mapping on the page is ambiguous. | https://www.jigsaw-online.com/pages/size-guide |
| Karen Millen (W) | verified | Guide moved. It now publishes letter sizes covering two UK sizes, with ranges (S = UK 8–10, bust 85–90), up to UK 28–30. The old single UK 6–20 rows matched no published chart. | https://www.karenmillen.com/pages/informational/size-guide |
| Lacoste (W) | verified | Body chart is now in the product-page modal. Letter sizes with FR/UK and ranges (S = 34–36 / UK 6–8, bust 82–86). XL (UK 18–20) added; US removed (not published). | https://www.lacoste.com/gb/lacoste/women/clothing/dresses-skirts/EF5473-00.html (Size guide → Body Measurements) |

Notes: Notes text was corrected where it contradicted the official charts (Jigsaw range, Karen Millen range, Hugo Boss EU 36 = UK 8). hollister-w and lacoste-w had an unindented `],` closing their sizes block; this was re-indented (whitespace only). This run's working copy first started from main instead of the existing audit branch, so it repeated batch 2's brands. That duplicate work was discarded and batch 2 (2026-10-25) was kept as committed. Checks: build OK, verify.mjs 0 failures (401 rows / 47 entries, 12 flags), api tests 21 passed. Queue: 580 todo, 1 skipped (Hollister).

## 2026-10-26 — batch 4 (scheduled run, v1.5.3)

8 queue entries (Lipsy → Oasis). Pages were read in the built-in browser on the brands' own sites; optional cookies were rejected where a banner appeared (Mint Velvet "Reject All", ASOS and Weekday "Only required"), and there were no sign-ins. The built-in browser (desktop app) went offline partway through Monki, so the rest of the batch was skipped. Result: 4 verified, 0 flagged, 4 skipped. Hollister (skipped in batch 3) was not retried.

| Brand | Outcome | What changed | Official URL |
|---|---|---|---|
| Lipsy (W) | verified | lipsy.co.uk redirects to Next, which owns Lipsy; product pages show a Lipsy London "Womens Clothing" chart. Now UK 4–28 (was 6–16): UK 12 bust 91 → 93, waist 74 → 75, hips 97 → 100; UK 16 bust 103 → 105, hips 109 → 112. Letter sizes kept as altLabel; UK 4 has no US/EU (conversion table starts at UK 6). | https://www.next.co.uk/style/sv051734/h05888 (Size Guide) |
| Lululemon (W) | verified | Guide moved (old /en-gb/size-guide is blank). Tops chart gives chest only (cm, ranges for US 4–10); waist/hip from the bottoms chart on the same page, same US sizes. US 6 bust 86 → 83.8–86.4, hips 91 → 91.4–94; US 12 bust 99 → 101.6, hips 104 → 109.2. UK/EU conversions replaced with lululemon's own (US 8 = UK 12–14, was 10–12). Extended to US 20. Notes corrected. | https://www.lululemon.co.uk/en-gb/content/global-size-guide/global-all-size-guide.html |
| Mint Velvet (W) | verified | Site moved to mintvelvet.com. Official chart is UK 6–18 (stored 8–20): UK 10 bust 88 → 86, hips 94 → 96; UK 16 bust 102 → 105, waist 83 → 87, hips 108 → 113. UK 20 removed (not published), UK 6 added. US from the guide's US view; EU removed because the EU view just repeats the UK numbers. Notes corrected (6–18, not 6–20). | https://mintvelvet.com/pages/size-guide |
| Miss Selfridge (W) | verified | missselfridge.com now redirects to ASOS, which owns the brand; ASOS product pages carry a separate "Women / Miss Selfridge" guide (not the ASOS DESIGN chart). UK 8 bust 83 → 82, waist 66 → 64; UK 12 bust 91 → 92, hips 96 → 98.5; UK 16 bust 103 → 102, waist 86 → 84. UK 4 added; UK 18 is listed with no measurements, so it is left out. | https://www.asos.com/miss-selfridge/miss-selfridge-button-through-long-sleeve-top-in-black/prd/210768629 (Size Guide) |
| Monki (W) | skipped | Browser went offline mid-check. Found so far: monki.com now says it has moved to weekday.com. Weekday's guide states Weekday, Monki and Cheap Monday use the same body measurements, but its charts are images (no DOM table), and the product-page chart sits in a cross-origin widget. Retry next run; flag if no readable table can be found. | https://www.weekday.com/en-gb/customer-service/size-guide/ |
| Monsoon (W) | skipped | Browser offline before this brand was reached. Retry next run. | — |
| Mountain Warehouse (W) | skipped | Browser offline before this brand was reached. Retry next run. | — |
| Oasis (W) | skipped | Browser offline before this brand was reached. Retry next run. | — |

Notes: Checks: build OK, verify.mjs 0 failures (439 rows / 51 entries, 12 flags), api tests 21 passed. Queue: 572 todo, 5 skipped (Hollister, Monki, Monsoon, Mountain Warehouse, Oasis).
