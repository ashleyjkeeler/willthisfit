// End-to-end tests for the Netlify functions with a fake Google key server and an
// in-memory PostgREST stand-in. Run: node tests/api.test.mjs
import http from "node:http";
import assert from "node:assert/strict";
import { generateKeyPair, exportJWK, SignJWT } from "jose";

const { publicKey, privateKey } = await generateKeyPair("RS256");
const jwk = { ...(await exportJWK(publicKey)), kid: "k1", alg: "RS256", use: "sig" };
const srv = http.createServer((q, r) => { r.setHeader("content-type", "application/json"); r.end(JSON.stringify({ keys: [jwk] })); });
await new Promise((ok) => srv.listen(0, ok));
process.env.GOOGLE_JWKS_URL = `http://127.0.0.1:${srv.address().port}/certs`;
process.env.GOOGLE_CLIENT_ID = "test-client.apps.googleusercontent.com";
process.env.SUPABASE_URL = "https://fake.supabase.co";
process.env.SUPABASE_SECRET_KEY = "sb_secret_test";

const token = (sub, extra = {}) => new SignJWT({ email: `${sub}@x.com`, name: `User ${sub}`, ...extra })
  .setProtectedHeader({ alg: "RS256", kid: "k1" }).setIssuer("https://accounts.google.com")
  .setAudience(process.env.GOOGLE_CLIENT_ID).setSubject(sub).setIssuedAt().setExpirationTime("1h").sign(privateKey);

// ── in-memory PostgREST ──
const T = { users: [], wardrobe_items: [], kudos_events: [] };
let seq = 1; const uuid = () => `00000000-0000-4000-8000-${String(seq++).padStart(12, "0")}`;
const match = (row, params) => [...params].every(([k, v]) => {
  if (["select", "order", "limit", "on_conflict"].includes(k)) return true;
  if (v.startsWith("eq.")) return String(row[k]) === v.slice(3);
  if (v.startsWith("gte.")) return k === "reports" ? row[k] >= +v.slice(4) : new Date(row[k]) >= new Date(v.slice(4));
  if (v === "not.is.null") return row[k] !== null && row[k] !== undefined;
  throw new Error("unhandled filter " + k + "=" + v);
});
function views(name) {
  const opt = T.users.filter((u) => u.leaderboard_opt_in);
  const ms = new Date(); ms.setUTCDate(1); ms.setUTCHours(0, 0, 0, 0);
  if (name.startsWith("leaderboard")) return opt.map((u) => { const ks = T.kudos_events.filter((k) => k.user_id === u.id && (name === "leaderboard_all" || new Date(k.created_at) >= ms)); return { display_name: u.display_name || "Anonymous", kudos: ks.reduce((s, k) => s + k.points, 0), items: new Set(ks.map((k) => k.item_id)).size }; }).filter((r) => r.kudos > 0);
  if (name === "community_fit") { const g = {}; for (const i of T.wardrobe_items.filter((i) => i.brand_id && i.overall_fit)) { const k = i.brand_id + "|" + i.size_label + "|" + i.garment_type; g[k] ||= { brand_id: i.brand_id, size_label: i.size_label, garment_type: i.garment_type, reports: 0, too_small: 0, just_right: 0, too_big: 0 }; g[k].reports++; g[k][i.overall_fit]++; } return Object.values(g); }
}
const calls = [];
globalThis.fetch = async (url, opt = {}) => {
  const u = new URL(url); const table = u.pathname.split("/").pop(); const p = u.searchParams; const m = opt.method || "GET";
  calls.push(`${m} ${table}`);
  assert.equal(opt.headers.apikey, "sb_secret_test");
  assert.equal(opt.headers.Authorization, undefined, "new-style keys must not go in Authorization");
  const body = opt.body ? JSON.parse(opt.body) : null; const now = new Date().toISOString();
  let out;
  if (m === "GET") { const src = T[table] || views(table); out = src.filter((r) => match(r, p)); if (p.get("order")?.startsWith("kudos.desc")) out.sort((a, b) => b.kudos - a.kudos); if (p.get("order")?.startsWith("created_at.desc")) out = out.reverse(); if (p.get("limit")) out = out.slice(0, +p.get("limit")); }
  else if (m === "POST") {
    out = [];
    for (const r of body) {
      if (table === "users") { let ex = T.users.find((x) => x.google_sub === r.google_sub); if (ex) Object.assign(ex, r); else { ex = { id: uuid(), display_name: null, leaderboard_opt_in: false, measurements: {}, is_reviewer: false, created_at: now, ...r }; T.users.push(ex); } out.push(ex); }
      else if (table === "kudos_events") { if (T.kudos_events.some((k) => k.item_id === r.item_id && k.kind === r.kind)) return new Response("dup", { status: 409 }); const row = { id: seq++, created_at: now, ...r }; T.kudos_events.push(row); out.push(row); }
      else { const row = { id: uuid(), status: "accepted", created_at: now, ...r }; T[table].push(row); out.push(row); }
    }
  } else if (m === "PATCH") { out = T[table].filter((r) => match(r, p)); out.forEach((r) => Object.assign(r, body)); }
  else if (m === "DELETE") { const gone = T[table].filter((r) => match(r, p)); T[table] = T[table].filter((r) => !gone.includes(r));
    if (table === "users") { const ids = gone.map((g) => g.id); T.wardrobe_items = T.wardrobe_items.filter((i) => !ids.includes(i.user_id)); T.kudos_events = T.kudos_events.filter((k) => !ids.includes(k.user_id)); }
    if (table === "wardrobe_items") { const ids = gone.map((g) => g.id); T.kudos_events = T.kudos_events.filter((k) => !ids.includes(k.item_id)); }
    out = null; }
  return new Response(out === null ? "" : JSON.stringify(out), { status: 200 });
};

const me = (await import("../netlify/functions/me.js")).default;
const wardrobe = (await import("../netlify/functions/wardrobe.js")).default;
const leaderboard = (await import("../netlify/functions/leaderboard.js")).default;
const community = (await import("../netlify/functions/community-fit.js")).default;
const call = async (fn, method, path, tok, body) => {
  const res = await fn(new Request("https://willthisfit.me" + path, { method, headers: tok ? { authorization: "Bearer " + tok } : {}, body: body ? JSON.stringify(body) : undefined }));
  return { status: res.status, body: await res.json() };
};

let pass = 0; const ok = (c, m) => { assert.ok(c, m); pass++; };
const A = await token("alice"), B = await token("bob");

// auth
ok((await call(me, "GET", "/api/me")).status === 401, "no token -> 401");
ok((await call(me, "GET", "/api/me", A.slice(0, -4) + "AAAA")).status === 401, "tampered token -> 401");
const wrongAud = await new SignJWT({}).setProtectedHeader({ alg: "RS256", kid: "k1" }).setIssuer("https://accounts.google.com").setAudience("other").setSubject("eve").setExpirationTime("1h").sign(privateKey);
ok((await call(me, "GET", "/api/me", wrongAud)).status === 401, "wrong audience -> 401");
const expired = await new SignJWT({}).setProtectedHeader({ alg: "RS256", kid: "k1" }).setIssuer("https://accounts.google.com").setAudience(process.env.GOOGLE_CLIENT_ID).setSubject("eve").setIssuedAt(1).setExpirationTime(2).sign(privateKey);
ok((await call(me, "GET", "/api/me", expired)).status === 401, "expired token -> 401");

// first sign-in creates user
let r = await call(me, "GET", "/api/me", A);
ok(r.status === 200 && r.body.kudos.total === 0 && r.body.items === 0, "new user profile");
ok(T.users.length === 1 && !("email" in r.body.user), "email never returned to client");

// add items
r = await call(wardrobe, "POST", "/api/wardrobe", A, { brand_id: "ms-w", brand_name: "Marks & Spencer", garment_type: "tops", size_label: "12", size_system: "uk", overall_fit: "just_right", garment_cm: { pit_to_pit: 52, length: 64 } });
ok(r.status === 201, "item saved");
ok(r.body.item.kudos === 10 && r.body.kudos.total === 10, "2 item + 5 garment + 3 first-for-size = 10 kudos");
r = await call(wardrobe, "POST", "/api/wardrobe", B, { brand_id: "ms-w", brand_name: "Marks & Spencer", garment_type: "tops", size_label: "12", overall_fit: "too_small" });
ok(r.body.item.kudos === 2, "second report for same size: no first bonus");
r = await call(wardrobe, "POST", "/api/wardrobe", A, { brand_name: "", garment_type: "tops", size_label: "12" });
ok(r.status === 400 && /brand/.test(r.body.error), "validation: brand required");
r = await call(wardrobe, "POST", "/api/wardrobe", A, { brand_name: "Zara", garment_type: "hats", size_label: "M" });
ok(r.status === 400, "validation: garment type");
r = await call(wardrobe, "POST", "/api/wardrobe", A, { brand_name: "Zara", garment_type: "tops", size_label: "M", garment_cm: { pit_to_pit: 520, length: 60 } });
ok(r.status === 201 && r.body.dropped.includes("pit_to_pit") && r.body.item.kudos === 0, "implausible measurement dropped, no kudos without fit or 2 measurements");

// daily cap
for (let i = 0; i < 12; i++) r = await call(wardrobe, "POST", "/api/wardrobe", A, { brand_name: "Next", garment_type: "tops", size_label: "14", overall_fit: "just_right", garment_cm: { pit_to_pit: 50, length: 60 } });
ok(r.body.kudos.total <= 40 && r.body.capped === true, "daily cap of 40 holds: " + r.body.kudos.total);

// list + isolation
r = await call(wardrobe, "GET", "/api/wardrobe", B);
ok(r.body.items.length === 1, "bob sees only his items");
const aliceItems = (await call(wardrobe, "GET", "/api/wardrobe", A)).body.items;
const bobId = r.body.items[0].id;
r = await call(wardrobe, "DELETE", "/api/wardrobe?id=" + bobId, A);
ok(T.wardrobe_items.some((i) => i.id === bobId), "alice cannot delete bob's item");
const before = (await call(me, "GET", "/api/me", A)).body.kudos.total;
r = await call(wardrobe, "DELETE", "/api/wardrobe?id=" + aliceItems.at(-1).id, A);
ok(r.body.kudos.total === before - 10, "deleting an item removes its kudos");

// profile + leaderboard
r = await call(me, "PATCH", "/api/me", A, { display_name: "Ash<script>", leaderboard_opt_in: true, measurements: { bust: 90, waist: 72, hips: 9999 } });
ok(r.body.user.display_name === "Ashscript" && r.body.user.measurements.bust === 90 && !("hips" in r.body.user.measurements), "profile sanitised");
r = await call(leaderboard, "GET", "/api/leaderboard?period=month");
ok(r.body.rows.length === 1 && r.body.rows[0].display_name === "Ashscript", "only opted-in users on leaderboard");

// community fit threshold
r = await call(community, "GET", "/api/community-fit?brand=ms-w");
ok(r.body.rows.length === 0, "fewer than 3 reports withheld");
// (alice's M&S 12 was the item deleted above, so bob's is the only report left)
for (const who of ["carol", "dave"]) await call(wardrobe, "POST", "/api/wardrobe", await token(who), { brand_id: "ms-w", brand_name: "Marks & Spencer", garment_type: "tops", size_label: "12", overall_fit: "just_right" });
r = await call(community, "GET", "/api/community-fit?brand=ms-w");
ok(r.body.rows.length === 1 && r.body.rows[0].reports === 3 && r.body.rows[0].just_right === 2, "aggregate shown at 3 reports");

// delete account
r = await call(me, "DELETE", "/api/me", B);
ok(r.body.deleted && !T.users.some((u) => u.google_sub === "bob") && !T.wardrobe_items.some((i) => i.id === bobId), "account deletion cascades");

console.log(`api tests: ${pass} passed`);
srv.close();
