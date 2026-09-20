import { BLOB_KEY, DEFAULT_DATA, isAuthorized, json, playerStore, unauthorized } from "./lib/store.js";

export default async (req) => {
  if (!isAuthorized(req)) return unauthorized();
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return json({ error: "invalid json" }, 400);
  }

  const store = playerStore();
  const current = (await store.get(BLOB_KEY, { type: "json" })) || DEFAULT_DATA;

  const next = {
    settings: current.settings,
    days: { ...current.days },
  };

  if (body.settings && Array.isArray(body.settings.enabledNumbers)) {
    next.settings = { enabledNumbers: body.settings.enabledNumbers };
  }

  if (typeof body.addMinutes === "number" && body.addMinutes > 0) {
    const date = typeof body.date === "string" ? body.date : new Date().toISOString().slice(0, 10);
    next.days[date] = (next.days[date] || 0) + body.addMinutes;
  }

  await store.setJSON(BLOB_KEY, next);
  return json(next);
};
