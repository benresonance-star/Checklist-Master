// ----------------------------------------------------
// Admin Mode UI — Master Template Editor
// ----------------------------------------------------
// v1.0 stable — reorder + delete + autosave draft
// ----------------------------------------------------

const MASTER_DRAFT_KEY = "masterChecklistDraftV1";
let currentMaster = null;

// ----------------------------------------------------
// Init
// ----------------------------------------------------

function initAdminUI() {
  loadMasterDraft();
  renderAdminUI();
}

function loadMasterDraft() {
  try {
    const raw = localStorage.getItem(MASTER_DRAFT_KEY);
    if (raw) {
      currentMaster = JSON.parse(raw);
      return;
    }
  } catch (e) {
    console.warn("Error loading draft, falling back to default", e);
  }

  currentMaster = JSON.parse(JSON.stringify(window.MASTER_CHECKLIST));
  saveMasterDraft();
}

function saveMasterDraft() {
  try {
    localStorage.setItem(MASTER_DRAFT_KEY, JSON.stringify(currentMaster));
  } catch (e) {
    console.warn("Error saving draft", e);
  }
}

function resetMasterDraftToOriginal() {
  if (!confirm("Reset draft to original MASTER_CHECKLIST? This cannot be undone.")) return;
  currentMaster = JSON.parse(JSON.stringify(window.MASTER_CHECKLIST));
  saveMasterDraft();
  renderAdminUI();
}

// ----------------------------------------------------
// Reorder helpers
// ----------------------------------------------------

function moveUp(list, index) {
  if (index <= 0) return;
  [list[index - 1], list[index]] = [list[index], list[index - 1]];
  renumber(list);
}

function moveDown(list, index) {
  if (index >= list.length - 1) return;
  [list[index + 1], list[index]] = [list[index], list[index + 1]];
  renumber(list);
}

function renumber(list) {
  list.forEach((item, i) => (item.order = i + 1));
  saveMasterDraft();
}

// ----------------------------------------------------
// Delete helpers
// ----------------------------------------------------

function deleteSection(sectionIndex) {
  if (!confirm("Delete this section and all its subsections/tasks?")) return;
  currentMaster.sections.splice(sectionIndex, 1);
  renumber(currentMaster.sections);
  renderAdminUI();
}

function deleteSubsection(section, subIndex) {
  if (!confirm("Delete this subsection and all its tasks?")) return;
  section.subsections.splice(subIndex, 1);
  renumber(section.subsections);
  renderAdminUI();
}

function deleteTask(subsection, taskIndex) {
  if (!confirm("Delete this task?")) return;
  subsection.tasks.splice(taskIndex, 1);
  renumber(subsection.tasks);
  renderAdminUI();
}

// ----------------------------------------------------
// UI Render
// ----------------------------------------------------

function renderAdminUI() {
  const app = qs("#app");
  app.innerHTML = "";

  // Header
  const header = el("div", "card admin-header");
  header.innerHTML = `
    <h1>Admin – Master Template</h1>
    <p>Edit sections, subsections & tasks. Changes autosave locally.</p>
  `;
  const row = el("div", "admin-header-buttons");

  const exportBtn = el("button", "btn-primary", "Export JSON");
  exportBtn.onclick = showExportModal;

  const resetBtn = el("button", "btn-secondary", "Reset draft");
  resetBtn.onclick = resetMasterDraftToOriginal;

  const addBtn = el("button", "btn-primary-outline", "＋ Add Section");
  addBtn.onclick = addSection;

  row.append(exportBtn, resetBtn, addBtn);
  header.append(row);
  app.append(header);

  // Sections
  currentMaster.sections
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .forEach((section, i) => app.append(renderSection(section, i)));

  // Bottom add button
  const bottom = el("div", "card admin-add-section-bottom");
  const addBottom = el("button", "btn-primary-outline full-width", "＋ Add Section");
  addBottom.onclick = addSection;
  bottom.append(addBottom);
  app.append(bottom);
}

// ----------------------------------------------------
// Render Section
// ----------------------------------------------------

function renderSection(section, sectionIndex) {
  const card = el("div", "card admin-section-card");

  // Header
  const header = el("div", "admin-section-header");

  const titleInput = el("input", "admin-section-title-input");
  titleInput.value = section.title || "";
  titleInput.placeholder = "Section title";
  titleInput.oninput = () => {
    section.title = titleInput.value;
    saveMasterDraft();
  };

  const titleWrap = el("div", "admin-section-title-wrap");
  titleWrap.append(titleInput);

  // Actions: reorder + delete
  const actions = el("div", "admin-header-actions");

  const arrows = el("div", "admin-arrow-group");
  const up = el("button", "btn-arrow", "▲");
  const down = el("button", "btn-arrow", "▼");
  up.onclick = () => {
    moveUp(currentMaster.sections, sectionIndex);
    renderAdminUI();
  };
  down.onclick = () => {
    moveDown(currentMaster.sections, sectionIndex);
    renderAdminUI();
  };

  arrows.append(up, down);

  const del = el("button", "btn-delete", "✕");
  del.onclick = () => deleteSection(sectionIndex);

  actions.append(arrows, del);

  header.append(titleWrap, actions);
  card.append(header);

  // Subsections
  const subs = el("div", "admin-subsections");
  (section.subsections || [])
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .forEach((sub, i) => subs.append(renderSubsection(section, sub, i)));
  card.append(subs);

  const addSub = el("button", "btn-small-outline", "＋ Add Subsection");
  addSub.onclick = () => addSubsection(section);
  card.append(addSub);

  return card;
}

// ----------------------------------------------------
// Render Subsection
// ----------------------------------------------------

function renderSubsection(section, subsection, subIndex) {
  const block = el("div", "admin-subsection");

  const header = el("div", "admin-subsection-header");

  const titleInput = el("input", "admin-subsection-title-input");
  titleInput.value = subsection.title || "";
  titleInput.placeholder = "Subsection title";
  titleInput.oninput = () => {
    subsection.title = titleInput.value;
    saveMasterDraft();
  };

  const titleWrap = el("div", "admin-subsection-title-wrap");
  titleWrap.append(titleInput);

  const actions = el("div", "admin-header-actions");

  const arrows = el("div", "admin-arrow-group");
  const up = el("button", "btn-arrow", "▲");
  const down = el("button", "btn-arrow", "▼");

  up.onclick = () => {
    moveUp(section.subsections, subIndex);
    renderAdminUI();
  };
  down.onclick = () => {
    moveDown(section.subsections, subIndex);
    renderAdminUI();
  };

  arrows.append(up, down);

  const del = el("button", "btn-delete", "✕");
  del.onclick = () => deleteSubsection(section, subIndex);

  actions.append(arrows, del);

  header.append(titleWrap, actions);
  block.append(header);

  // Tasks
  const tasks = el("div", "admin-tasks");
  (subsection.tasks || [])
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .forEach((task, i) => tasks.append(renderTask(subsection, task, i)));

  block.append(tasks);

  const addTaskBtn = el("button", "btn-small-outline", "＋ Add Task");
  addTaskBtn.onclick = () => addTask(subsection);
  block.append(addTaskBtn);

  return block;
}

// ----------------------------------------------------
// Render Task
// ----------------------------------------------------

function renderTask(subsection, task, taskIndex) {
  const block = el("div", "admin-task");

  const topRow = el("div", "admin-task-toprow");
  const label = el("span", "admin-task-label", "Task");

  const actions = el("div", "admin-header-actions");

  const arrows = el("div", "admin-arrow-group");
  const up = el("button", "btn-arrow", "▲");
  const down = el("button", "btn-arrow", "▼");

  up.onclick = () => {
    moveUp(subsection.tasks, taskIndex);
    renderAdminUI();
  };
  down.onclick = () => {
    moveDown(subsection.tasks, taskIndex);
    renderAdminUI();
  };

  arrows.append(up, down);

  const del = el("button", "btn-delete", "✕");
  del.onclick = () => deleteTask(subsection, taskIndex);

  actions.append(arrows, del);
  topRow.append(label, actions);

  // Description
  const textarea = el("textarea", "admin-task-textarea");
  textarea.value = task.text || "";
  textarea.placeholder = "Task description";
  textarea.oninput = () => {
    task.text = textarea.value;
    saveMasterDraft();
  };

  // Note
  const noteLabel = el("label", "admin-task-label", "Master note (optional)");
  const noteArea = el("textarea", "admin-task-textarea admin-task-notearea");
  noteArea.value = task.note || "";
  noteArea.placeholder = "Optional guidance, URL, or extra info";
  noteArea.oninput = () => {
    task.note = noteArea.value;
    saveMasterDraft();
  };

  block.append(topRow, textarea, noteLabel, noteArea);

  return block;
}

// ----------------------------------------------------
// Add items
// ----------------------------------------------------

function addSection() {
  currentMaster.sections.push({
    id: makeId("sec"),
    title: "New Section",
    order: currentMaster.sections.length + 1,
    subsections: []
  });
  saveMasterDraft();
  renderAdminUI();
}

function addSubsection(section) {
  section.subsections.push({
    id: makeId("sub"),
    title: "New Subsection",
    order: (section.subsections.length || 0) + 1,
    tasks: []
  });
  saveMasterDraft();
  renderAdminUI();
}

function addTask(subsection) {
  subsection.tasks.push({
    id: makeId("task"),
    title: "New Task",
    order: (subsection.tasks.length || 0) + 1,
    text: "New task",
    note: ""
  });
  saveMasterDraft();
  renderAdminUI();
}

// ----------------------------------------------------
// Export Modal
// ----------------------------------------------------

function showExportModal() {
  const json = JSON.stringify(currentMaster, null, 2);

  const overlay = el("div", "admin-modal-backdrop");
  const modal = el("div", "admin-modal");

  modal.innerHTML = `
    <h2>Export Master Template JSON</h2>
    <p>Copy into <code>master-template.js</code> to publish.</p>
  `;

  const textarea = el("textarea", "admin-modal-textarea");
  textarea.value = json;

  const close = el("button", "btn-primary", "Close");
  close.onclick = () => document.body.removeChild(overlay);

  modal.append(textarea, close);
  overlay.append(modal);
  document.body.append(overlay);
}
