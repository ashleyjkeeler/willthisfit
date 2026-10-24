// /api/leaderboard?period=month|all — public. Only people who opted in, by display name.
import { json, handle, db } from "../lib/server.js";

export default handle(async (req) => {
  const period = new URL(req.url).searchParams.get("period") === "all" ? "all" : "month";
  const view = period === "all" ? "leaderboard_all" : "leaderboard_month";
  const rows = await db("GET", `${view}?select=display_name,kudos,items&order=kudos.desc&limit=20`);
  return json(200, { ok: true, period, rows }, { "Cache-Control": "public, max-age=60" });
});

export const config = { path: "/api/leaderboard" };
