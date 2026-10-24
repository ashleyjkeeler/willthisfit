# Vintage (decade) sizing: sources and method

## What's in the app (v1.3.0)
Marks & Spencer women's sizes for the 1950s, 1960s, 1970s, 1980s and 1990s.

**Source:** the M&S Company Archive's online catalogue (msheritage.access.preservica.com). The archive's cataloguers transcribe the label of each St Michael garment and date it, for example: *"A St Michael Regd Dress, Nylon, Size 12. To Fit Bust 34, Hips 36." (c1959)*. This is the brand's own published statement of the body each size was made to fit.

**Collected (23–24 Oct 2026):** every catalogue entry matching "to fit" (1,380 entries; 791 contain "to fit" in their label text). The raw extract is in `ms-archive-raw.json`.

## Method (`parse_ms.py`, then `build_tables.py`, then `to_js.py`)
1. **Label text only.** Only the label wording the archive quotes is read, not the cataloguer's own description. For example, one record's description says "waist of 40 inches" but the label says "to fit hips 40"", and the label is what we use.
2. **Garments with more than one label size** (e.g. a size 10 jacket with a size 12 skirt) are split into separate records.
3. **Units.** Values are kept exactly as printed, in inches and/or cm.
   - If a label prints both and they disagree by more than 3 cm, the record is excluded (11 records).
   - Inch-only labels are converted at exactly 2.54 cm per inch, and the row is marked `cmFromInches`.
4. **Which records are used.** Women's garments with a single UK size and the archive's own date. Records with no date, a date spanning two decades, or children's and men's items are excluded.
5. **Figure for each decade and size.** For each dimension, the app shows the value printed on **most** labels.
   - If no value is on more than half the labels, the dimension is left blank.
   - Disagreeing labels are listed in `ms-decade-tables.json` (`disagree`) with their archive links.
   - Nothing is averaged or interpolated, and sizes with no label evidence are absent.
6. **Checks.**
   - Every one of the 297 records used was reviewed line by line against its label text (`review.txt`).
   - Six random records were re-read live on the archive site on 24 Oct 2026, and all matched.

## Findings
- From the 1950s to the late 1980s, M&S size 12 labels say "to fit bust 34in / hips 36in" (86/91 cm). Today M&S's size 12 is for a 92.1 cm bust.
- Around 1990 some size 12 labels change to 35in/88cm bust and 37in/95cm hips. Because the 1990s labels are split, the 1990s size 12 hips value is left blank.
- Anomalies are kept out of the tables but recorded in `ms-decade-tables.json`:
  - A 1968 size 18 dress labelled hips 38".
  - A 1985 size 16 labelled bust 36in.
  - A 1986–93 uniform size 12 labelled bust 81cm.

## Not used, and why
- **BS 3666 (UK size designation standard):** sold only by BSI, so there is no free official copy to read.
- **US CS 215-58 / PS 42-70:** not digitised anywhere reachable. NIST IR 5411 (1994) is free but contains no size tables.
- **V&A collections API:** keyword search returns mostly unrelated objects. It might be worth a targeted pass later.
- **Earlier decade figures for 47 brands:** no source was ever recorded, and some decades were copies of each other. They were removed from the app and kept for reference in `unverified-historical-data-pre-2026-10.js`.

## Possible next sources
- **M&S men's labels:** 55 chest records are already collected, but letter sizes vary by garment type, so these need a separate review.
- **Other brand archives with label transcriptions:** none found yet.
- **User-submitted dated labels:** via Contribute.
