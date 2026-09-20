import { clearStoredPin, getStoredPin } from "./auth.js";

const BASE = "/.netlify/functions";

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      "content-type": "application/json",
      "x-player-pin": getStoredPin() || "",
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    // The stored PIN is no longer valid (e.g. it was rotated server-side) -
    // drop it and force the PIN gate again on next load.
    clearStoredPin();
    location.reload();
    throw new Error("unauthorized");
  }

  if (!res.ok) {
    throw Object.assign(new Error("request failed"), { status: res.status });
  }

  return res.json();
}

export function loadData() {
  return request("/load-data");
}

export function saveData(body) {
  return request("/save-data", { method: "POST", body: JSON.stringify(body) });
}
