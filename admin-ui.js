// ----------------------------------------------------
// Admin Mode UI - editing master template + management
// ----------------------------------------------------

async function initAdminUI() {
  const profile = await loadProfile();
  if (!profile || profile.role !== "admin") {
    document.body.innerHTML = "<h3>Admin access required</h3>";
    return;
  }

  renderAdminUI();
}

function renderAdminUI() {
  const app = qs("#app");
  app.innerHTML = "<h1>Admin Mode</h1>";

  const container = el("div", "card");
  container.innerHTML = `
    <p>Master Template Editor</p>
    <p>(Inline editing, reorder, import/export will be implemented here.)</p>
  `;

  app.appendChild(container);
}
