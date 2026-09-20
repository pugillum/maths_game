import { renderLanding } from "./views/landing.js";
import { renderPlay } from "./views/play.js";
import { renderSettings } from "./views/settings.js";
import { renderStats } from "./views/stats.js";

const routes = {
  "": renderLanding,
  "play": renderPlay,
  "settings": renderSettings,
  "stats": renderStats,
};

const app = document.getElementById("app");
let cleanup = null;

function currentRoute() {
  return location.hash.replace(/^#\/?/, "");
}

function navigate() {
  if (typeof cleanup === "function") {
    cleanup();
  }
  cleanup = null;
  app.innerHTML = "";

  const route = currentRoute();
  const render = routes[route];

  if (!render) {
    location.hash = "#/";
    return;
  }

  cleanup = render(app) || null;
}

window.addEventListener("hashchange", navigate);
navigate();
