import { getStore } from "@netlify/blobs";

export const BLOB_KEY = "player-data";

export const DEFAULT_DATA = {
  settings: { enabledNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
  days: {},
};

export function playerStore() {
  // Strong consistency: save-data does read-modify-write, so a stale read would write old
  // settings back over a fresh change (e.g. a playtime save right after a settings toggle).
  return getStore({ name: "player-data", consistency: "strong" });
}

export function isAuthorized(req) {
  const expected = process.env.PLAYER_PIN;
  const provided = req.headers.get("x-player-pin");
  return Boolean(expected) && provided === expected;
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export function unauthorized() {
  return json({ error: "unauthorized" }, 401);
}
