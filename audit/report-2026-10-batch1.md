# WillThisFit data audit, batch 1 (22 Oct 2026)

Released as **v1.2.0** (live on willthisfit.netlify.app; willthisfit.me once DNS is pointed at Netlify).

**Rule:** a number goes in only if it was read on the brand's own website on 22 Oct 2026. Retailer pages and size-guide aggregators don't count as evidence. Every stored number was then checked automatically against the verified record: 301 size rows in 34 entries, 0 mismatches.

## What changed in the app
- **Ranges.** When a brand publishes a range (e.g. bust 86–90), the app now stores and shows the minimum and maximum. The Measure tab treats any measurement inside the range as a perfect match. A single midpoint is still kept for older code; it is marked as derived.
- **Inch-only brands** (M&S, Nike, Joules): converted at exactly 2.54 cm per inch and rounded to 0.1 cm. The original inch values are kept in the audit files.
- **Audit notes.** Brands that couldn't be confirmed now show a red 🔍 note and an "Unverified" badge instead of a confidence %.
- **Decade data.** These figures are now labelled unverified. The old banner claimed they came from "archive size guides and BSI standards", but no source is recorded for any of them.
- Help and the changelog have been updated.

## Verified and corrected (34 entries)
adidas W/M, ASOS W/M, Barbour W/M, Boden W, COS W/M, Fat Face W/M, Gap W/M, H&M W/M, Joules W/M, Levi's W/M (two duplicate men's entries), M&S W/M, Next M, Nike W/M, Primark M, Ralph Lauren W/M, River Island W/M, Seasalt W/M, White Stuff W/M.

Main errors found:
- **Barbour W and M:** every row was shifted one size, and the source was a retailer.
- **White Stuff W:** UK 10 was a copy of UK 12; UK 6–10 and 18–22 were wrong; UK 24 was missing; the source was a retailer.
- **White Stuff M:** up to 14 cm off at the top sizes (old 3XL chest 122 vs official 126–132).
- **ASOS M:** old 3XL chest 119 vs official 137–142.
- **Fat Face W and M:** every size was 1–7 cm off; UK 6 and 4XL were missing.
- **Next M:** for example, M chest 97 was below Next's own M range (99–104).
- **Waist removed** where the brand doesn't publish it for tops (M&S M, Joules M, Next M, Primark M, Levi's 5XL). It had previously been filled in with no source.
- **UK/US/EU columns left blank** where the brand doesn't publish them (Levi's W letter sizes, Fat Face, Boden, H&M US). They had previously been filled in by convention.
- **Wrong sources replaced:** retailers (mcelhinneys, simplybeach, whitefinn, Next for Levi's), Gap Kuwait, the COS US site, and dead URLs (Boden, Levi's, H&M, Joules).

## Flagged, could not verify (10 entries)
| Entry | Reason |
|---|---|
| Zara W/M | No body chart, only a height/weight recommender |
| Uniqlo W/M | Garment measurements per product only |
| Next W | Conversions only, no women's body measurements |
| Primark W | Conversions verified; no cm published |
| Mango W/M | Site blocked automated access (403) |
| New Look W | Size guide behind a bot check |
| Boden M | Boden UK no longer sells menswear |

**Manual check wanted:** Mango and New Look. Open their size guides in a normal browser; if you send screenshots, I'll transcribe them.

## Still open
1. **Decade data (47 brands):** no sources recorded, and some decades are copies of each other (M&S 1980 = 1985). The History page drift chart also cites "Brand archive" without detail. These need real sources, such as old catalogues, BS 3666/BS 1445 and SizeUK, or removal. Until then they stay labelled unverified.
2. **Duplicates:** levis-m and levis2-m (same chart); shoe ids grenson-s and loake-s each appear twice.
3. **Copied charts:** Topshop, Warehouse, Oasis and Miss Selfridge (now sold through ASOS) appear to reuse the ASOS chart. Check in batch 2.
4. **Notes and fit text** ("runs small", etc.) are mostly unsourced opinion. Review them separately.
5. **Next:** batch 2 (Hollister, A&F, Tommy, Superdry, Whistles, Reiss, AllSaints, Arket, & Other Stories, Monsoon, Hobbs, Phase Eight, TNF, Patagonia, Lululemon, Gymshark, SHEIN, PLT, boohoo, UO, Free People, Jigsaw, Mint Velvet, Ted Baker, Karen Millen, Lacoste, Fred Perry, Hugo Boss, Jack & Jones, Weekday, Monki, Coast, Lipsy, Yours, Simply Be). Then kids, shoes, bras, and new brands in all four categories.
