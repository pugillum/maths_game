import { BLOB_KEY, isAuthorized, json, playerStore, unauthorized } from "./lib/store.js";

// Overwrites the whole blob with a backup (see the private maths_game_data repo). Used by `just restore`.
export default async (req) => {
  if (!isAuthorized(req)) return unauthorized();
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return json({ error: "invalid json" }, 400);
  }

  const valid =
    body &&
    body.settings &&
    Array.isArray(body.settings.enabledNumbers) &&
    body.days &&
    typeof body.days === "object" &&
    !Array.isArray(body.days);
  if (!valid) return json({ error: "expected { settings: { enabledNumbers }, days }" }, 400);

  const data = { settings: { enabledNumbers: body.settings.enabledNumbers }, days: body.days };
  await playerStore().setJSON(BLOB_KEY, data);
  return json(data);
};
