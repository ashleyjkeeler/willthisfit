// /api/community-fit?brand=<brand_id> — public, aggregated fit reports for one brand.
// Sizes with fewer than MIN_REPORTS reports are withheld (too few to mean anything, and
// small counts could reveal individuals).
import { json, handle, db, enc, HttpError } from "../lib/server.js";

const MIN_REPORTS = 3;

export default handle(async (req) => {
  const brand = new URL(req.url).searchParams.get("brand");
  if (!brand || !/^[a-z0-9-]{1,60}$/.test(brand)) throw new HttpError(400, "bad brand");
  const rows = await db("GET", `community_fit?brand_id=eq.${enc(brand)}&reports=gte.${MIN_REPORTS}&select=size_label,garment_type,reports,too_small,just_right,too_big`);
  return json(200, { ok: true, brand, min_reports: MIN_REPORTS, rows }, { "Cache-Control": "public, max-age=300" });
});

export const config = { path: "/api/community-fit" };
