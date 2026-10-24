// Kudos rules for wardrobe items. Pure functions so they can be unit-tested.
// Points are only for evidence that passes automatic checks; daily caps stop farming.

export const RULES = {
  item: 2,          // a wardrobe item with an overall fit verdict
  garment_cm: 5,    // flat garment measurements that pass the range check
  first_for_size: 3 // first fit report anyone has made for this brand + size
};
export const DAILY_CAP = 40; // max kudos per user per UTC day from wardrobe items

export const GARMENT_TYPES = ["tops", "bottoms", "one-piece", "suit", "outerwear", "knitwear", "shoes", "other"];
export const SIZE_SYSTEMS = ["uk", "eu", "us", "letter", "waist-leg", "other"];
export const FITS = ["too_small", "just_right", "too_big"];
export const AREA_FITS = ["tight", "right", "loose"];
export const AREAS = ["chest", "waist", "hips", "length", "shoulders", "sleeves", "inside_leg"];
export const GARMENT_FIELDS = ["pit_to_pit", "waist_flat", "hip_flat", "length", "sleeve", "inside_leg", "rise"];
export const BOUGHT_ON = ["vinted", "ebay", "depop", "charity", "store", "online", "gift", "other"];

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Flat garment measurements in cm. Plausible ranges per field; anything outside is dropped
// (kept out of the database) rather than stored as a typo.
const RANGES = { pit_to_pit: [25, 110], waist_flat: [20, 100], hip_flat: [25, 110], length: [20, 180], sleeve: [10, 100], inside_leg: [20, 110], rise: [10, 60] };

export function cleanItem(b) {
  const errors = [];
  const brand_name = str(b.brand_name, 80);
  const size_label = str(b.size_label, 20);
  if (!brand_name) errors.push("brand");
  if (!size_label) errors.push("size");
  const garment_type = GARMENT_TYPES.includes(b.garment_type) ? b.garment_type : null;
  if (!garment_type) errors.push("garment type");
  const out = {
    brand_id: str(b.brand_id, 60) || null,
    brand_name, size_label, garment_type,
    size_system: SIZE_SYSTEMS.includes(b.size_system) ? b.size_system : "other",
    overall_fit: FITS.includes(b.overall_fit) ? b.overall_fit : null,
    fit_by_area: {},
    bought_year: Number.isInteger(+b.bought_year) && +b.bought_year >= 1900 && +b.bought_year <= new Date().getUTCFullYear() ? +b.bought_year : null,
    garment_cm: {},
    bought_on: BOUGHT_ON.includes(b.bought_on) ? b.bought_on : null,
    notes: str(b.notes, 500) || null,
  };
  for (const a of AREAS) if (AREA_FITS.includes(b.fit_by_area?.[a])) out.fit_by_area[a] = b.fit_by_area[a];
  const dropped = [];
  for (const f of GARMENT_FIELDS) {
    const v = b.garment_cm?.[f];
    if (v === undefined || v === null || v === "") continue;
    const n = Math.round(Number(v) * 10) / 10;
    if (Number.isFinite(n) && n >= RANGES[f][0] && n <= RANGES[f][1]) out.garment_cm[f] = n;
    else dropped.push(f);
  }
  return { item: out, errors, dropped };
}

// Which kudos an accepted item earns, given today's total so far and whether
// anyone has reported this brand+size before.
export function kudosFor(item, { earnedToday = 0, firstForSize = false } = {}) {
  const events = [];
  if (item.overall_fit) events.push({ kind: "item", points: RULES.item });
  if (Object.keys(item.garment_cm || {}).length >= 2) events.push({ kind: "garment_cm", points: RULES.garment_cm });
  if (item.overall_fit && item.brand_id && firstForSize) events.push({ kind: "first_for_size", points: RULES.first_for_size });
  let room = Math.max(0, DAILY_CAP - earnedToday);
  const paid = [];
  for (const e of events) { if (e.points <= room) { paid.push(e); room -= e.points; } }
  return { paid, capped: paid.length < events.length };
}
