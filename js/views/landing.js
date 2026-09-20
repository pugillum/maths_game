export function renderLanding(container) {
  container.innerHTML = `
    <div class="landing">
      <h1 class="landing-title">Times Tables Practice</h1>
      <nav class="landing-nav">
        <a class="landing-btn" href="#/play">Play</a>
        <a class="landing-btn" href="#/settings">Settings</a>
        <a class="landing-btn" href="#/stats">Stats</a>
      </nav>
    </div>
  `;
}
