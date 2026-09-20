import { ALL_NUMBERS, MIN_ENABLED, getEnabledNumbers, setEnabledNumbers } from "../store.js";

export function renderSettings(container) {
  const enabled = new Set(getEnabledNumbers());

  container.innerHTML = `
    <a class="home-link" href="#/">&larr; Home</a>
    <div class="settings-view">
      <h1 class="settings-title">Settings</h1>
      <p class="settings-hint">Choose which times tables to practice.</p>
      <div class="number-grid"></div>
      <p class="settings-hint">At least ${MIN_ENABLED} tables must stay on.</p>
    </div>
  `;

  const grid = container.querySelector(".number-grid");

  function draw() {
    grid.innerHTML = "";
    ALL_NUMBERS.forEach((n) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "number-toggle" + (enabled.has(n) ? " active" : "");
      btn.textContent = String(n);
      btn.setAttribute("aria-pressed", enabled.has(n) ? "true" : "false");
      btn.addEventListener("click", () => toggle(n));
      grid.appendChild(btn);
    });
  }

  function toggle(n) {
    if (enabled.has(n)) {
      if (enabled.size <= MIN_ENABLED) return;
      enabled.delete(n);
    } else {
      enabled.add(n);
    }
    setEnabledNumbers(Array.from(enabled));
    draw();
  }

  draw();
}
