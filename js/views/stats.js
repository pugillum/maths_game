import { loadData } from "../api.js";
import { formatDate } from "../store.js";

const WEEKS = 20;

function buildColumns(days) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(today);
  start.setDate(start.getDate() - (WEEKS * 7 - 1));
  start.setDate(start.getDate() - start.getDay()); // rewind to the preceding Sunday

  const columns = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    const column = [];
    for (let dow = 0; dow < 7; dow++) {
      if (cursor > today) {
        column.push(null);
      } else {
        const key = formatDate(cursor);
        column.push({ date: key, minutes: days[key] || 0 });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    columns.push(column);
  }
  return columns;
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DOW_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

function monthLabelsFor(columns) {
  let prevMonth = null;
  return columns.map((column) => {
    const first = column[0];
    if (!first) return null;
    const month = first.date.slice(5, 7);
    if (month === prevMonth) return null;
    prevMonth = month;
    return MONTH_LABELS[Number(month) - 1];
  });
}

function tierFor(minutes) {
  if (minutes <= 0) return 0;
  if (minutes < 1) return 1;
  if (minutes < 2) return 2;
  if (minutes < 5) return 3;
  return 4;
}

function computeStreak(days) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cursor = new Date(today);

  if (!(days[formatDate(cursor)] > 0)) {
    // Today has no playtime yet - don't let that break an in-progress streak.
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (days[formatDate(cursor)] > 0) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function renderStats(container) {
  container.innerHTML = `
    <a class="home-link" href="#/">&larr; Home</a>
    <div class="stats-view">
      <h1 class="stats-title">Stats</h1>
      <p class="streak-text">Loading&hellip;</p>
      <div class="stats-grid-wrap">
        <div class="stats-graph"></div>
      </div>
    </div>
  `;

  const streakText = container.querySelector(".streak-text");
  const graph = container.querySelector(".stats-graph");

  loadData()
    .then((data) => {
      const days = data.days || {};
      const streak = computeStreak(days);
      streakText.textContent = streak === 1 ? "🔥 1 day streak" : `🔥 ${streak} day streak`;

      const columns = buildColumns(days);
      const monthLabels = monthLabelsFor(columns);

      graph.innerHTML = "";
      graph.style.gridTemplateColumns = `auto repeat(${columns.length}, 12px)`;
      graph.style.gridTemplateRows = "auto repeat(7, 12px)";

      const corner = document.createElement("div");
      corner.className = "stats-corner";
      corner.style.gridColumn = "1";
      corner.style.gridRow = "1";
      graph.appendChild(corner);

      monthLabels.forEach((label, colIndex) => {
        if (!label) return;
        const labelEl = document.createElement("div");
        labelEl.className = "stats-month-label";
        labelEl.style.gridColumn = String(colIndex + 2);
        labelEl.style.gridRow = "1";
        labelEl.textContent = label;
        graph.appendChild(labelEl);
      });

      DOW_LABELS.forEach((label, dow) => {
        const labelEl = document.createElement("div");
        labelEl.className = "stats-day-label";
        labelEl.style.gridColumn = "1";
        labelEl.style.gridRow = String(dow + 2);
        labelEl.textContent = label;
        graph.appendChild(labelEl);
      });

      columns.forEach((column, colIndex) => {
        column.forEach((cell, dow) => {
          const cellEl = document.createElement("div");
          cellEl.style.gridColumn = String(colIndex + 2);
          cellEl.style.gridRow = String(dow + 2);
          if (cell) {
            cellEl.className = "stats-cell tier-" + tierFor(cell.minutes);
            cellEl.title = cell.date + ": " + Math.round(cell.minutes) + " min";
          } else {
            cellEl.className = "stats-cell tier-future";
          }
          graph.appendChild(cellEl);
        });
      });
    })
    .catch(() => {
      streakText.textContent = "Couldn't load stats.";
    });
}
