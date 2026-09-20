const PIN_KEY = "mathsGame.pin";

export function getStoredPin() {
  return localStorage.getItem(PIN_KEY);
}

function setStoredPin(pin) {
  localStorage.setItem(PIN_KEY, pin);
}

export function clearStoredPin() {
  localStorage.removeItem(PIN_KEY);
}

export async function ensureAuthenticated(container) {
  if (getStoredPin()) return;
  await showPinGate(container);
}

function showPinGate(container) {
  return new Promise((resolve) => {
    container.innerHTML = `
      <div class="pin-gate">
        <h1 class="pin-title">Enter PIN</h1>
        <form class="pin-form">
          <input class="pin-input" type="password" inputmode="numeric" autocomplete="off" />
          <button class="pin-submit" type="submit">Go</button>
        </form>
        <p class="pin-error" hidden>Incorrect PIN, try again.</p>
      </div>
    `;

    const form = container.querySelector(".pin-form");
    const input = container.querySelector(".pin-input");
    const error = container.querySelector(".pin-error");
    input.focus();

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const pin = input.value.trim();
      if (!pin) return;

      setStoredPin(pin);
      const ok = await verifyPin();
      if (ok) {
        resolve();
      } else {
        clearStoredPin();
        error.hidden = false;
        input.value = "";
        input.focus();
      }
    });
  });
}

async function verifyPin() {
  try {
    const res = await fetch("/.netlify/functions/load-data", {
      headers: { "x-player-pin": getStoredPin() || "" },
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}
