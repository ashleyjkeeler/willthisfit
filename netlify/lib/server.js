// Shared server helpers for Netlify functions.
// - verifyGoogle: checks the Google ID token's signature, issuer, audience and expiry.
// - db: minimal Supabase REST (PostgREST) client using the server-only secret key.
import { createRemoteJWKSet, jwtVerify } from "jose";

// GOOGLE_JWKS_URL is only overridden by the local test harness.
const GOOGLE_JWKS = createRemoteJWKSet(new URL(process.env.GOOGLE_JWKS_URL || "https://www.googleapis.com/oauth2/v3/certs"));

export const json = (status, body, extra = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...extra },
  });

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export async function verifyGoogle(req) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) throw new HttpError(401, "sign-in required");
  const aud = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
  if (!aud) throw new HttpError(503, "sign-in not configured");
  try {
    const { payload } = await jwtVerify(token, GOOGLE_JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: aud,
    });
    if (!payload.sub) throw new Error("no subject");
    return { sub: String(payload.sub), email: payload.email || null, name: payload.name || null };
  } catch {
    throw new HttpError(401, "sign-in expired or invalid");
  }
}

function dbConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new HttpError(503, "database not configured");
  return { url: url.replace(/\/$/, ""), key };
}

// db("GET", "users?google_sub=eq.123&select=*")
export async function db(method, path, body, { prefer } = {}) {
  const { url, key } = dbConfig();
  const headers = { apikey: key, "Content-Type": "application/json" };
  if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`; // legacy service_role JWT
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error("db error", method, path.split("?")[0], res.status, text.slice(0, 300));
    throw new HttpError(res.status === 409 ? 409 : 500, "database error");
  }
  return text ? JSON.parse(text) : null;
}

export const enc = encodeURIComponent;

// Find or create the user row for a verified Google identity.
export async function upsertUser(g) {
  const rows = await db("POST", "users?on_conflict=google_sub&select=*", [{ google_sub: g.sub, email: g.email, name: g.name }],
    { prefer: "resolution=merge-duplicates,return=representation" });
  return rows[0];
}

export async function kudosTotals(userId) {
  const rows = await db("GET", `kudos_events?user_id=eq.${enc(userId)}&select=points,created_at`);
  const monthStart = new Date(); monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
  let total = 0, month = 0;
  for (const r of rows) { total += r.points; if (new Date(r.created_at) >= monthStart) month += r.points; }
  return { total, month };
}

export function handle(fn) {
  return async (req, ctx) => {
    try { return await fn(req, ctx); }
    catch (e) {
      if (e instanceof HttpError) return json(e.status, { ok: false, error: e.message });
      console.error(e);
      return json(500, { ok: false, error: "server error" });
    }
  };
}
