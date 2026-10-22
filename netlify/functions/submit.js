// Receives corrections from the app and forwards them to Airtable.
// The Airtable token lives only in Netlify environment variables (AIRTABLE_API_KEY),
// never in the browser bundle.
export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let d;
  try { d = await req.json(); } catch { return new Response("Bad request", { status: 400 }); }

  const clip = (v, n) => String(v ?? "").slice(0, n);
  const fields = {
    Type: clip(d.type, 100),
    Brand: clip(d.brand, 200),
    Category: clip(d.category, 100),
    Details: clip(d.details, 5000),
    Email: clip(d.email, 200),
    Status: "Pending review",
    SubmittedAt: new Date().toISOString(),
  };

  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE } = process.env;
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE) {
    return new Response(JSON.stringify({ ok: false, error: "not configured" }), { status: 503, headers: { "Content-Type": "application/json" } });
  }
  const res = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
    }
  );
  return new Response(JSON.stringify({ ok: res.ok }), {
    status: res.ok ? 200 : 502,
    headers: { "Content-Type": "application/json" },
  });
};
