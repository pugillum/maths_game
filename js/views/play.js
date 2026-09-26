import { loadData, saveData } from "../api.js";
import { ALL_NUMBERS, MIN_ENABLED, todayString } from "../store.js";

const HEARTBEAT_MS = 30000;

const BALL_COLORS = [
  "#ff6b6b",
  "#ffa94d",
  "#ffd43b",
  "#69db7c",
  "#4dabf7",
  "#9775fa",
  "#f783ac",
  "#3bc9db",
];

const PRAISE = [
  "Nice one!", "Great job!", "Correct!", "You got it!",
  "Awesome!", "Brilliant!", "Well done!", "Superstar!",
  "Go Girl!", "Fantastic!", "Excellent!", "You're a star!",
  "Keep it up!", "Way to go!", "You're amazing!"
];

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

function choice(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function generateDistractors(a, b, correct, count) {
  const pool = new Set();

  function add(v) {
    if (v > 0 && v !== correct) pool.add(v);
  }

  if (b > 1) add(a * (b - 1));
  add(a * (b + 1));
  if (a > 1) add((a - 1) * b);
  add((a + 1) * b);
  add(correct + 1);
  add(correct - 1);
  add(correct + 2);
  add(correct - 2);
  add(correct + 3);
  add(correct - 3);

  const candidates = shuffle(Array.from(pool));
  const result = candidates.slice(0, count);

  // Top up with small random offsets if the pool was too short.
  let attempts = 0;
  while (result.length < count && attempts < 50) {
    attempts++;
    const offset = choice([-4, -3, -2, -1, 1, 2, 3, 4]);
    const candidate = correct + offset;
    if (candidate > 0 && candidate !== correct && result.indexOf(candidate) === -1) {
      result.push(candidate);
    }
  }

  return result;
}

export function renderPlay(container) {
  container.innerHTML = `
    <a class="home-link" href="#/">&larr; Home</a>
    <div id="play-area">
      <div id="message"></div>
    </div>
    <div id="equation-bar">
      <div id="equation">? x ?</div>
    </div>
  `;

  const playArea = container.querySelector("#play-area");
  const equationEl = container.querySelector("#equation");
  const messageEl = container.querySelector("#message");

  let locked = false; // true once correct answer chosen, until next question loads
  let currentAnswer = null;
  let enabledNumbers = ALL_NUMBERS;

  // The first question waits for settings so it's drawn from the player's chosen tables.
  loadData()
    .then((data) => {
      if (Array.isArray(data.settings?.enabledNumbers) && data.settings.enabledNumbers.length >= MIN_ENABLED) {
        enabledNumbers = data.settings.enabledNumbers;
      }
    })
    .catch(() => {})
    .finally(() => nextQuestion());

  let lastHeartbeat = Date.now();

  function flushPlaytime() {
    const now = Date.now();
    const elapsedMinutes = (now - lastHeartbeat) / 60000;
    lastHeartbeat = now;
    if (elapsedMinutes > 0) {
      saveData({ addMinutes: elapsedMinutes, date: todayString() }).catch(() => {});
    }
  }

  const heartbeatId = setInterval(flushPlaytime, HEARTBEAT_MS);

  function onVisibilityChange() {
    if (document.visibilityState === "hidden") flushPlaytime();
  }
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pagehide", flushPlaytime);

  function clearBoard() {
    playArea.querySelectorAll(".ball").forEach((b) => b.remove());
  }

  function findPosition(areaRect, size, placed) {
    const maxX = Math.max(0, areaRect.width - size);
    const maxY = Math.max(0, areaRect.height - size);
    const minDist = size * 1.15;

    for (let attempt = 0; attempt < 40; attempt++) {
      const x = rand(0, maxX);
      const y = rand(0, maxY);
      let ok = true;
      for (let i = 0; i < placed.length; i++) {
        const dx = placed[i].x - x;
        const dy = placed[i].y - y;
        if (Math.sqrt(dx * dx + dy * dy) < minDist) {
          ok = false;
          break;
        }
      }
      if (ok) return { x, y };
    }
    // Fallback: accept last attempted position even if a bit close.
    return { x: rand(0, maxX), y: rand(0, maxY) };
  }

  function placeBalls(values) {
    const areaRect = playArea.getBoundingClientRect();
    const size = Math.max(56, Math.min(84, areaRect.width / 5));
    const placed = [];

    values.forEach((value) => {
      const ball = document.createElement("button");
      ball.className = "ball";
      ball.type = "button";
      ball.textContent = value;
      ball.setAttribute("aria-label", "Answer " + value);

      ball.style.background = choice(BALL_COLORS);
      ball.style.setProperty("--size", size + "px");

      const pos = findPosition(areaRect, size, placed);
      placed.push(pos);

      ball.style.setProperty("--x", pos.x + "px");
      ball.style.setProperty("--y", pos.y + "px");
      ball.style.setProperty("--drift-x", rand(6, 16).toFixed(1) + "px");
      ball.style.setProperty("--drift-y", rand(8, 20).toFixed(1) + "px");
      ball.style.setProperty("--float-dur", rand(2.4, 4).toFixed(2) + "s");
      ball.style.setProperty("--float-delay", rand(0, 1.5).toFixed(2) + "s");

      ball.dataset.value = value;
      ball.addEventListener("pointerdown", onBallTap, { passive: true });

      playArea.appendChild(ball);
    });
  }

  function onBallTap(e) {
    if (locked) return;
    const ball = e.currentTarget;
    const value = Number(ball.dataset.value);

    if (value === currentAnswer) {
      handleCorrect(ball);
    } else {
      handleWrong(ball);
    }
  }

  function handleWrong(ball) {
    ball.classList.add("dissolve");
    ball.addEventListener("transitionend", () => {
      ball.remove();
    }, { once: true });
  }

  function handleCorrect(correctBall) {
    locked = true;

    playArea.querySelectorAll(".ball:not(.correct)").forEach((b) => {
      if (b !== correctBall) b.classList.add("fade-out");
    });

    correctBall.classList.add("correct");

    spawnFireworks(correctBall);

    messageEl.textContent = choice(PRAISE);
    messageEl.classList.add("show");

    setTimeout(() => {
      messageEl.classList.remove("show");
      clearBoard();
      nextQuestion();
      locked = false;
    }, 1400);
  }

  function spawnFireworks(fromBall) {
    const rect = fromBall.getBoundingClientRect();
    const areaRect = playArea.getBoundingClientRect();
    const cx = rect.left - areaRect.left + rect.width / 2;
    const cy = rect.top - areaRect.top + rect.height / 2;

    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div");
      particle.className = "particle";
      const angle = (Math.PI * 2 * i) / particleCount + rand(-0.2, 0.2);
      const distance = rand(50, 130);

      particle.style.background = choice(BALL_COLORS);
      particle.style.setProperty("--px", cx + "px");
      particle.style.setProperty("--py", cy + "px");
      particle.style.setProperty("--tx", (Math.cos(angle) * distance).toFixed(1) + "px");
      particle.style.setProperty("--ty", (Math.sin(angle) * distance).toFixed(1) + "px");

      playArea.appendChild(particle);
      setTimeout(() => particle.remove(), 950);
    }
  }

  function nextQuestion() {
    const table = choice(enabledNumbers);
    const other = randInt(1, 10);
    const swap = Math.random() < 0.5;
    const a = swap ? other : table;
    const b = swap ? table : other;
    const correct = a * b;
    currentAnswer = correct;

    equationEl.textContent = a + " × " + b;

    const ballCount = randInt(4, 6);
    const distractors = generateDistractors(a, b, correct, ballCount - 1);
    const values = shuffle([correct].concat(distractors));

    placeBalls(values);
  }

  return function cleanup() {
    clearInterval(heartbeatId);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("pagehide", flushPlaytime);
    flushPlaytime();
  };
}
