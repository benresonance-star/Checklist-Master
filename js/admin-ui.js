//
// =============================================================
//  ADMIN MODE – MASTER TEMPLATE EDITOR
//  Full rewrite v3.2 (with autosize + persistent heights)
// =============================================================
//

// Local draft key
const MASTER_DRAFT_KEY = "masterChecklistDraftV3";

// Current working master object (local draft)
let currentMaster = null;

// =============================================================
// INIT
// =============================================================

function initAdminUI() {
  loadMasterDraft();
  renderAdminUI();
}

// Load draft from localStorage or clone MASTER_CHECKLIST
function loadMasterDraft() {
  try {
    const raw = localStorage.getItem(MASTER_DRAFT_KEY);
    if (raw) {
      currentMaster = JSON.parse(raw);
      return;
    }
  } catch (e) {
    console.warn("Failed to load draft, using default.", e);
  }

  // fallback to original template
  currentMaster = JSON.parse(JSON.stringify(window.MASTER_CHECKLIST));
  saveMasterDraft();
}

function saveMasterDraft() {
  try {
    localStorage.setItem(MASTER_DRAFT_KEY, JSON.stringify(currentMaster));
  } catch (e) {
    console.warn("Failed to save master draft.", e);
  }
}

// =============================================================
// UTILITIES
// =============================================================

// Helper: create element
function el(tag, className, text) {
  const x = document.createElement(tag);
  if (className) x.className = className;
  if (text) x.textContent = text;
  return x;
}

// Helper: query
function qs(sel) {
  return document.querySelector(sel);
}

// Make an ID
function makeId(prefix) {
  return prefix + "_" + Math.random().toString(36).slice(2, 10);
}

// Auto resize textarea
function autoresize(el) {
  el.style.height = "auto";
  el.style.height = (el.scrollHeight + 2) + "px";
}

// Move item up
function moveUp(list, index) {
  if (index <= 0) return;
  [list[index - 1], list[index]] = [list[index], list[index - 1]];
  renumber(list);
}

// Move item down
function moveDown(list, index) {
  if (index >= list.length - 1) return;
  [list[index + 1], list[index]] = [list[index], list[index + 1]];
  renumber(list);
}

// Renumber items by order
function renumber(list) {
  list.forEach((item, i) => (item.order = i + 1));
  saveMasterDraft();
}

// =============================================================
// RENDER ROOT
// =============================================================

function renderAdminUI() {
  const app = qs("#app");
  app.innerHTML = "";

  // HEADER
  const header = el("div", "card admin-header");
  header.innerHTML = `
    <h1>Admin – Master Template</h1>
    <p>Edit sections, subsections & tasks. Changes autosave locally.</p>
  `;

  // Only “Export JSON”
  const headerBtns = el("div", "admin-header-buttons");
  const exportBtn = el("button", "btn-primary", "Export JSON");
  exportBtn.addEventListener("click", showExportModal);

  headerBtns.appendChild(exportBtn);
  header.appendChild(headerBtns);
  app.appendChild(header);

  // Render all sections
  currentMaster.sections
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .forEach((section, index) => {
      app.appendChild(renderSection(section, index));
    });

  // Add section button at bottom
  const bottom = el("div", "card admin-add-section-bottom");
  const addSectionBtn = el("button", "btn-primary-outline full-width", "＋ Add Section");
  addSectionBtn.addEventListener("click", addSection);
  bottom.appendChild(addSectionBtn);
  app.appendChild(bottom);
}

// =============================================================
// SECTION RENDER
// =============================================================

function renderSection(section, sectionIndex) {
  const card = el("div", "card admin-section-card");

  // HEADER
  const head = el("div", "admin-section-header");

  // Left side (toggle + title)
  const left = el("div", "admin-section-left");

  const toggleBtn = el("button", "btn-toggle");
  toggleBtn.innerHTML = section._collapsed ? "▸" : "▾";
  toggleBtn.title = "Toggle section";

  toggleBtn.addEventListener("click", () => {
    section._collapsed = !section._collapsed;
    saveMasterDraft();
    renderAdminUI();
  });

  const titleWrap = el("div", "admin-section-title-wrap");
  const titleInput = el("input", "admin-section-title-input");
  titleInput.value = section.title || "";
  titleInput.placeholder = "Section title";

  titleInput.addEventListener("input", () => {
    section.title = titleInput.value;
    saveMasterDraft();
  });

  titleWrap.appendChild(titleInput);
  left.appendChild(toggleBtn);
  left.appendChild(titleWrap);

  // Right side controls
  const right = el("div", "admin-header-actions");

  // Move Up
  const up = el("button", "btn-arrow", "▲");
  up.title = "Move section up";
  up.addEventListener("click", () => {
    moveUp(currentMaster.sections, sectionIndex);
    renderAdminUI();
  });

  // Move Down
  const down = el("button", "btn-arrow", "▼");
  down.title = "Move section down";
  down.addEventListener("click", () => {
    moveDown(currentMaster.sections, sectionIndex);
    renderAdminUI();
  });

  // Duplicate
  const dup = el("button", "btn-arrow");
  dup.innerHTML = "⧉";
  dup.title = "Duplicate section";
  dup.addEventListener("click", () => {
    duplicateSection(section);
  });

  // Delete
  const del = el("button", "btn-delete", "✕");
  del.title = "Delete section";
  del.addEventListener("click", () => {
    if (!confirm("Delete this section?")) return;
    currentMaster.sections.splice(sectionIndex, 1);
    renumber(currentMaster.sections);
    renderAdminUI();
  });

  right.appendChild(up);
  right.appendChild(down);
  right.appendChild(dup);
  right.appendChild(del);

  head.appendChild(left);
  head.appendChild(right);
  card.appendChild(head);

  // COLLAPSED? Stop here
  if (section._collapsed) return card;

  // BODY
  const body = el("div", "admin-section-body");

  (section.subsections || [])
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .forEach((sub, idx) => {
      body.appendChild(renderSubsection(section, sub, idx));
    });

  // Add Subsection
  const addSubBtn = el("button", "btn-small-outline", "＋ Add Subsection");
  addSubBtn.style.marginTop = "8px";
  addSubBtn.addEventListener("click", () => addSubsection(section));

  body.appendChild(addSubBtn);
  card.appendChild(body);

  return card;
}

// =============================================================
// SUBSECTION RENDER
// =============================================================

function renderSubsection(section, subsection, subIndex) {
  const box = el("div", "admin-subsection");

  // HEADER
  const head = el("div", "admin-subsection-header");

  const left = el("div", "admin-subsection-left");

  const toggleBtn = el("button", "btn-toggle");
  toggleBtn.innerHTML = subsection._collapsed ? "▸" : "▾";
  toggleBtn.title = "Toggle subsection";
  toggleBtn.addEventListener("click", () => {
    subsection._collapsed = !subsection._collapsed;
    saveMasterDraft();
    renderAdminUI();
  });

  const titleWrap = el("div", "admin-subsection-title-wrap");
  const titleInput = el("input", "admin-subsection-title-input");
  titleInput.value = subsection.title || "";
  titleInput.placeholder = "Subsection title";

  titleInput.addEventListener("input", () => {
    subsection.title = titleInput.value;
    saveMasterDraft();
  });

  titleWrap.appendChild(titleInput);
  left.appendChild(toggleBtn);
  left.appendChild(titleWrap);

  const right = el("div", "admin-arrow-group");

  // up
  const up = el("button", "btn-arrow", "▲");
  up.title = "Move subsection up";
  up.addEventListener("click", () => {
    moveUp(section.subsections, subIndex);
    renderAdminUI();
  });

  // down
  const down = el("button", "btn-arrow", "▼");
  down.title = "Move subsection down";
  down.addEventListener("click", () => {
    moveDown(section.subsections, subIndex);
    renderAdminUI();
  });

  // duplicate
  const dup = el("button", "btn-arrow", "⧉");
  dup.title = "Duplicate subsection";
  dup.addEventListener("click", () => duplicateSubsection(section, subsection));

  // delete
  const del = el("button", "btn-delete", "✕");
  del.title = "Delete subsection";
  del.addEventListener("click", () => {
    if (!confirm("Delete this subsection?")) return;
    section.subsections.splice(subIndex, 1);
    renumber(section.subsections);
    renderAdminUI();
  });

  right.appendChild(up);
  right.appendChild(down);
  right.appendChild(dup);
  right.appendChild(del);

  head.appendChild(left);
  head.appendChild(right);
  box.appendChild(head);

  // COLLAPSED?
  if (subsection._collapsed) return box;

  // BODY
  const body = el("div", "admin-subsection-body");

  (subsection.tasks || [])
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .forEach((task, tIndex) => {
      body.appendChild(renderTask(subsection, task, tIndex));
    });

  const addTaskBtn = el("button", "btn-small-outline", "＋ Add Task");
  addTaskBtn.style.marginTop = "6px";
  addTaskBtn.addEventListener("click", () => addTask(subsection));

  body.appendChild(addTaskBtn);
  box.appendChild(body);

  return box;
}

// =============================================================
// TASK RENDER
// =============================================================

function renderTask(subsection, task, taskIndex) {
  const wrap = el("div", "admin-task");

  // TOP ROW (label + controls)
  const top = el("div", "admin-task-toprow");

  const lbl = el("span", "admin-task-label", "Task");
  top.appendChild(lbl);

  const right = el("div", "admin-arrow-group");

  // Up
  const up = el("button", "btn-arrow", "▲");
  up.title = "Move task up";
  up.addEventListener("click", () => {
    moveUp(subsection.tasks, taskIndex);
    renderAdminUI();
  });

  // Down
  const down = el("button", "btn-arrow", "▼");
  down.title = "Move task down";
  down.addEventListener("click", () => {
    moveDown(subsection.tasks, taskIndex);
    renderAdminUI();
  });

  // Duplicate
  const dup = el("button", "btn-arrow", "⧉");
  dup.title = "Duplicate task";
  dup.addEventListener("click", () => duplicateTask(subsection, task));

  // Delete
  const del = el("button", "btn-delete", "✕");
  del.title = "Delete task";
  del.addEventListener("click", () => {
    if (!confirm("Delete this task?")) return;
    subsection.tasks.splice(taskIndex, 1);
    renumber(subsection.tasks);
    renderAdminUI();
  });

  right.appendChild(up);
  right.appendChild(down);
  right.appendChild(dup);
  right.appendChild(del);
  top.appendChild(right);

  wrap.appendChild(top);

  // TEXTAREA – Task description
  const textarea = el("textarea", "admin-task-textarea");
  textarea.value = task.text || "";
  textarea.placeholder = "Task description";

  // restore height if saved
  if (task._height) textarea.style.height = task._height + "px";
  autoresize(textarea);

  textarea.addEventListener("input", () => {
    task.text = textarea.value;
    task._height = textarea.scrollHeight;
    autoresize(textarea);
    saveMasterDraft();
  });

  wrap.appendChild(textarea);

  // NOTE LABEL
  const noteLabel = el("div", "admin-task-label", "Master note (optional guidance / URL)");
  wrap.appendChild(noteLabel);

  // TEXTAREA – Note
  const noteArea = el("textarea", "admin-task-notearea");
  noteArea.value = task.note || "";
  noteArea.placeholder = "Optional guidance, URL, or extra info";

  if (task._noteHeight) noteArea.style.height = task._noteHeight + "px";
  autoresize(noteArea);

  noteArea.addEventListener("input", () => {
    task.note = noteArea.value;
    task._noteHeight = noteArea.scrollHeight;
    autoresize(noteArea);
    saveMasterDraft();
  });

  wrap.appendChild(noteArea);

  return wrap;
}

// =============================================================
// ADD / DUPLICATE ACTIONS
// =============================================================

function addSection() {
  currentMaster.sections.push({
    id: makeId("sec"),
    title: "New Section",
    order: currentMaster.sections.length + 1,
    subsections: [],
    _collapsed: false
  });
  saveMasterDraft();
  renderAdminUI();
}

function addSubsection(section) {
  section.subsections = section.subsections || [];
  section.subsections.push({
    id: makeId("sub"),
    title: "New Subsection",
    order: section.subsections.length + 1,
    tasks: [],
    _collapsed: false
  });
  saveMasterDraft();
  renderAdminUI();
}

function addTask(subsection) {
  subsection.tasks = subsection.tasks || [];
  subsection.tasks.push({
    id: makeId("task"),
    order: subsection.tasks.length + 1,
    text: "New task",
    note: ""
  });
  saveMasterDraft();
  renderAdminUI();
}

function duplicateSection(section) {
  const clone = JSON.parse(JSON.stringify(section));
  clone.id = makeId("sec");
  currentMaster.sections.push(clone);
  renumber(currentMaster.sections);
  renderAdminUI();
}

function duplicateSubsection(section, subsection) {
  const clone = JSON.parse(JSON.stringify(subsection));
  clone.id = makeId("sub");
  section.subsections.push(clone);
  renumber(section.subsections);
  renderAdminUI();
}

function duplicateTask(subsection, task) {
  const clone = JSON.parse(JSON.stringify(task));
  clone.id = makeId("task");
  subsection.tasks.push(clone);
  renumber(subsection.tasks);
  renderAdminUI();
}

// =============================================================
// EXPORT MODAL
// =============================================================

function showExportModal() {
  const json = JSON.stringify(currentMaster, null, 2);

  const overlay = el("div", "admin-modal-backdrop");
  const modal = el("div", "admin-modal");

  const h = el("h2", "", "Export Master Template JSON");
  const p = el("p", "", "Copy this JSON into master-template.js and commit to GitHub.");

  const ta = el("textarea", "admin-modal-textarea");
  ta.value = json;

  const close = el("button", "btn-primary", "Close");
  close.addEventListener("click", () => document.body.removeChild(overlay));

  modal.appendChild(h);
  modal.appendChild(p);
  modal.appendChild(ta);
  modal.appendChild(close);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

