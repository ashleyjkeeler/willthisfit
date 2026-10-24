// /api/wardrobe — the signed-in user's wardrobe.
// GET: list items · POST: add an item (and credit kudos) · DELETE ?id=: remove an item (its kudos go too)
import { json, handle, verifyGoogle, upsertUser, db, enc, kudosTotals, HttpError } from "../lib/server.js";
import { cleanItem, kudosFor } from "../lib/kudos.js";

const MAX_ITEMS_PER_DAY = 100;
const FIELDS = "id,brand_id,brand_name,garment_type,size_label,size_system,overall_fit,fit_by_area,bought_year,garment_cm,bought_on,notes,status,created_at";

export default handle(async (req) => {
  const g = await verifyGoogle(req);
  const user = await upsertUser(g);
  const uid = enc(user.id);

  if (req.method === "GET") {
    const items = await db("GET", `wardrobe_items?user_id=eq.${uid}&select=${FIELDS}&order=created_at.desc`);
    const kudos = await db("GET", `kudos_events?user_id=eq.${uid}&select=item_id,points`);
    const byItem = {};
    for (const k of kudos) if (k.item_id) byItem[k.item_id] = (byItem[k.item_id] || 0) + k.points;
    return json(200, { ok: true, items: items.map((i) => ({ ...i, kudos: byItem[i.id] || 0 })) });
  }

  if (req.method === "POST") {
    let b; try { b = await req.json(); } catch { throw new HttpError(400, "bad request"); }
    const { item, errors, dropped } = cleanItem(b);
    if (errors.length) throw new HttpError(400, `missing or invalid: ${errors.join(", ")}`);

    const dayStart = new Date(); dayStart.setUTCHours(0, 0, 0, 0);
    const since = enc(dayStart.toISOString());
    const [today, kudosToday, prior] = await Promise.all([
      db("GET", `wardrobe_items?user_id=eq.${uid}&created_at=gte.${since}&select=id`),
      db("GET", `kudos_events?user_id=eq.${uid}&created_at=gte.${since}&select=points`),
      item.brand_id
        ? db("GET", `wardrobe_items?brand_id=eq.${enc(item.brand_id)}&size_label=eq.${enc(item.size_label)}&overall_fit=not.is.null&status=eq.accepted&select=id&limit=1`)
        : Promise.resolve([{}]),
    ]);
    if (today.length >= MAX_ITEMS_PER_DAY) throw new HttpError(429, "daily limit reached, try again tomorrow");

    const [saved] = await db("POST", `wardrobe_items?select=${FIELDS}`, [{ ...item, user_id: user.id }], { prefer: "return=representation" });
    const earnedToday = kudosToday.reduce((s, k) => s + k.points, 0);
    const { paid, capped } = kudosFor(saved, { earnedToday, firstForSize: prior.length === 0 });
    if (paid.length) {
      await db("POST", "kudos_events", paid.map((p) => ({ ...p, user_id: user.id, item_id: saved.id })), { prefer: "return=minimal" });
    }
    const totals = await kudosTotals(user.id);
    return json(201, {
      ok: true,
      item: { ...saved, kudos: paid.reduce((s, p) => s + p.points, 0) },
      earned: paid, capped, dropped, kudos: totals,
    });
  }

  if (req.method === "DELETE") {
    const id = new URL(req.url).searchParams.get("id");
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(400, "bad id");
    await db("DELETE", `wardrobe_items?id=eq.${enc(id)}&user_id=eq.${uid}`);
    return json(200, { ok: true, kudos: await kudosTotals(user.id) });
  }

  return json(405, { ok: false, error: "method not allowed" });
});

export const config = { path: "/api/wardrobe" };
