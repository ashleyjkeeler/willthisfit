// /api/me — the signed-in user's profile and kudos.
// GET: profile + kudos totals (creates the user row on first sign-in)
// PATCH: update display name, leaderboard opt-in, body measurements
// DELETE: delete the account and everything linked to it
import { json, handle, verifyGoogle, upsertUser, db, enc, kudosTotals, HttpError } from "../lib/server.js";

const MEAS = { bust: [50, 200], waist: [40, 200], hips: [50, 220], height: [120, 230], inside_leg: [50, 110], chest: [50, 200] };

const publicUser = (u) => ({
  display_name: u.display_name || "",
  leaderboard_opt_in: u.leaderboard_opt_in,
  measurements: u.measurements || {},
  is_reviewer: u.is_reviewer,
  member_since: u.created_at,
});

export default handle(async (req) => {
  const g = await verifyGoogle(req);
  const user = await upsertUser(g);

  if (req.method === "GET") {
    const [kudos, items] = await Promise.all([
      kudosTotals(user.id),
      db("GET", `wardrobe_items?user_id=eq.${enc(user.id)}&select=id`),
    ]);
    return json(200, { ok: true, user: publicUser(user), kudos, items: items.length });
  }

  if (req.method === "PATCH") {
    let b; try { b = await req.json(); } catch { throw new HttpError(400, "bad request"); }
    const patch = { updated_at: new Date().toISOString() };
    if (typeof b.display_name === "string") {
      const name = b.display_name.replace(/[^\p{L}\p{N} ._'-]/gu, "").trim().slice(0, 40);
      patch.display_name = name || null;
    }
    if (typeof b.leaderboard_opt_in === "boolean") patch.leaderboard_opt_in = b.leaderboard_opt_in;
    if (b.measurements && typeof b.measurements === "object") {
      const m = {};
      for (const [k, [lo, hi]] of Object.entries(MEAS)) {
        const v = Number(b.measurements[k]);
        if (Number.isFinite(v) && v >= lo && v <= hi) m[k] = Math.round(v * 10) / 10;
      }
      patch.measurements = m;
    }
    const rows = await db("PATCH", `users?id=eq.${enc(user.id)}&select=*`, patch, { prefer: "return=representation" });
    return json(200, { ok: true, user: publicUser(rows[0]) });
  }

  if (req.method === "DELETE") {
    await db("DELETE", `users?id=eq.${enc(user.id)}`); // wardrobe + kudos cascade
    return json(200, { ok: true, deleted: true });
  }

  return json(405, { ok: false, error: "method not allowed" });
});

export const config = { path: "/api/me" };
