import { BLOB_KEY, DEFAULT_DATA, isAuthorized, json, playerStore, unauthorized } from "./lib/store.js";

export default async (req) => {
  if (!isAuthorized(req)) return unauthorized();

  const store = playerStore();
  const data = (await store.get(BLOB_KEY, { type: "json" })) || DEFAULT_DATA;
  return json(data);
};
