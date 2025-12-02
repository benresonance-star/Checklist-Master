//
// =============================================================
//  ADMIN MODE – MASTER TEMPLATE EDITOR
//  v3.3  (compact UI + toggles + autosize textareas)
// =============================================================
//

// ------------- Local storage draft key -------------

const MASTER_DRAFT_KEY = "masterChecklistDraftV3";

let currentMaster = null;

// ------------- Small helpers (local) -------------

function qs(selector) {
  return document.querySelector(selector);
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function makeId(prefix) {
  return (prefix || "id") + "_" + Math.random().toString(36).slice(2, 10);
}

function autoresize(textarea) {
  if (!textarea) return;
  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight + 2 + "px";
}

// Move item up/down in a list and renumber its "order" fields
function moveUp(list, index) {
  if (!Array.isArray(list) || index <= 0 || index >= list.length) return;
  const tmp = list[index - 1];
  list[index - 1] = list[index];
  list[index] = tmp;
  renumber(list);
}

function moveDown(list, index) {
  if (!Array.isArray(list) || index < 0 || index >= list.length - 1) return;
  const tmp = list[index + 1];
  list[index + 1] = list[index];
  list[index] = tmp;
  renumber(list);
}

function renumber(list) {
  if (!Array.isArray(list)) return;
  for (let i = 0; i < list.length; i++) {
    list[i].order = i + 1;
  }
  saveMasterDraft();
}

// =============================================================
// INIT & DRAFT HANDLING
// =============================================================

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
  } catch (err) {
    console.warn("Failed to load draft, using MASTER_CHECKLIST.", err);
  }

  // Fallback to original template from master-template.js
  if (window.MASTER_CHECKLIST) {
    currentMaster = JSON.parse(JSON.stringify(window.MASTER_CHECKLIST));
  } else {
    currentMaster = { title: "Checklist", sections: [] };
  }
  saveMasterDraft();
}

function saveMasterDraft() {
  try {
    localStorage.setItem(MASTER_DRAFT_KEY, JSON.stringify(currentMaster));
  } catch (err) {
    console.warn("Failed to save draft", err);
  }
}

// =============================================================
// ROOT RENDER
// =============================================================

function renderAdminUI() {
  const app = qs("#app");
  if (!app) return;

  app.innerHTML = "";

  // ----- Header card -----
  const header = el("div", "card admin-header");
  const h1 = el("h1", null, "Admin – Master Template");
  const p = el(
    "p",
    null,
    "Edit sections, subsections & tasks. Changes autosave locally."
  );

  const btnRow = el("div", "admin-header-buttons");
  const exportBtn = el("button", "btn-primary", "Export JSON");
  exportBtn.addEventListener("click", showExportModal);
  btnRow.appendChild(exportBtn);

  header.appendChild(h1);
  header.appendChild(p);
  header.appendChild(btnRow);
  app.appendChild(header);

  // Ensure sections array
  if (!Array.isArray(currentMaster.sections)) {
    currentMaster.sections = [];
  }

  // ----- Sections -----
  currentMaster.sections
    .slice() // shallow copy so sort doesn't mutate original order unexpectedly
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .forEach((section, index) => {
      app.appendChild(renderSection(section, index));
    });

  // ----- Add Section button at bottom -----
  const addSectionCard = el("div", "card admin-add-section-bottom");
  const addSectionBtn = el(
    "button",
    "btn-primary-outline full-width",
    "＋ Add Section"
  );
  addSectionBtn.addEventListener("click", addSection);
  addSectionCard.appendChild(addSectionBtn);
  app.appendChild(addSectionCard);
}

// =============================================================
// SECTION RENDER
// =============================================================

function renderSection(section, sectionIndex) {
  const card = el("div", "card admin-section-card");

  // Header
  const header = el("div", "admin-section-header");

  const left = el("div", "admin-section-left");

  const toggleBtn = el("button", "btn-toggle");
  toggleBtn.innerHTML = section._collapsed ? "▸" : "▾";
  toggleBtn.title = "Collapse / expand section";
  toggleBtn.addEventListener("click", function () {
    section._collapsed = !section._collapsed;
    saveMasterDraft();
    renderAdminUI();
  });

  const titleWrap = el("div", "admin-section-title-wrap");
  const titleInput = el("input", "admin-section-title-input");
  titleInput.value = section.title || "";
  titleInput.placeholder = "Section title";
  titleInput.addEventListener("input", function () {
    section.title = titleInput.value;
    saveMasterDraft();
  });

  titleWrap.appendChild(titleInput);
  left.appendChild(toggleBtn);
  left.appendChild(titleWrap);

  const right = el("div", "admin-header-actions");

  const upBtn = el("button", "btn-arrow", "▲");
  upBtn.title = "Move section up";
  upBtn.addEventListener("click", function () {
    moveUp(currentMaster.sections, sectionIndex);
    renderAdminUI();
  });

  const downBtn = el("button", "btn-arrow", "▼");
  downBtn.title = "Move section down";
  downBtn.addEventListener("click", function () {
    moveDown(currentMaster.sections, sectionIndex);
    renderAdminUI();
  });

  const dupBtn = el("button", "btn-arrow");
  dupBtn.innerHTML = "⧉";
  dupBtn.title = "Duplicate section";
  dupBtn.addEventListener("click", function () {
    duplicateSection(section);
  });

  const delBtn = el("button", "btn-delete", "✕");
  delBtn.title = "Delete section";
  delBtn.addEventListener("click", function () {
    if (!confirm("Delete this section and all its subsections?")) return;
    currentMaster.sections.splice(sectionIndex, 1);
    renumber(currentMaster.sections);
    renderAdminUI();
  });

  right.appendChild(upBtn);
  right.appendChild(downBtn);
  right.appendChild(dupBtn);
  right.appendChild(delBtn);

  header.appendChild(left);
  header.appendChild(right);
  card.appendChild(header);

  // If collapsed, don't render body
  if (section._collapsed) {
    return card;
  }

  // Body
  const body = el("div", "admin-section-body");

  if (!Array.isArray(section.subsections)) {
    section.subsections = [];
  }

  section.subsections
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .forEach(function (sub, subIndex) {
      body.appendChild(renderSubsection(section, sub, subIndex));
    });

  const addSubBtn = el("button", "btn-small-outline", "＋ Add Subsection");
  addSubBtn.style.marginTop = "8px";
  addSubBtn.addEventListener("click", function () {
    addSubsection(section);
  });

  body.appendChild(addSubBtn);
  card.appendChild(body);

  return card;
}

// =============================================================
// SUBSECTION RENDER
// =============================================================

function renderSubsection(section, subsection, subIndex) {
  const container = el("div", "admin-subsection");

  const header = el("div", "admin-subsection-header");

  const left = el("div", "admin-subsection-left");

  const toggleBtn = el("button", "btn-toggle");
  toggleBtn.innerHTML = subsection._collapsed ? "▸" : "▾";
  toggleBtn.title = "Collapse / expand subsection";
  toggleBtn.addEventListener("click", function () {
    subsection._collapsed = !subsection._collapsed;
    saveMasterDraft();
    renderAdminUI();
  });

  const titleWrap = el("div", "admin-subsection-title-wrap");
  const titleInput = el("input", "admin-subsection-title-input");
  titleInput.value = subsection.title || "";
  titleInput.placeholder = "Subsection title";
  titleInput.addEventListener("input", function () {
    subsection.title = titleInput.value;
    saveMasterDraft();
  });

  titleWrap.appendChild(titleInput);
  left.appendChild(toggleBtn);
  left.appendChild(titleWrap);

  const right = el("div", "admin-arrow-group");

  const upBtn = el("button", "admin-icon-btn arrow", "▲");
  upBtn.title = "Move subsection up";
  upBtn.addEventListener("click", function () {
    moveUp(section.subsections, subIndex);
    renderAdminUI();
  });

  
  const downBtn = el("button", "admin-icon-btn arrow", "▼");
  downBtn.title = "Move subsection down";
  downBtn.addEventListener("click", function () {
    moveDown(section.subsections, subIndex);
    renderAdminUI();
  });

  const dupBtn = el("button", "admin-icon-btn duplicate", "⧉");
  dupBtn.innerHTML = "⧉";
  dupBtn.title = "Duplicate subsection";
  dupBtn.addEventListener("click", function () {
    duplicateSubsection(section, subsection);
  });

  const delBtn = el("button", "admin-icon-btn delete", "✕");
  delBtn.title = "Delete subsection";
  delBtn.addEventListener("click", function () {
    if (!confirm("Delete this subsection and all its tasks?")) return;
    section.subsections.splice(subIndex, 1);
    renumber(section.subsections);
    renderAdminUI();
  });

  right.appendChild(upBtn);
  right.appendChild(downBtn);
  right.appendChild(dupBtn);
  right.appendChild(delBtn);

  header.appendChild(left);
  header.appendChild(right);
  container.appendChild(header);

  // Collapsed view
  if (subsection._collapsed) {
    return container;
  }

  const body = el("div", "admin-subsection-body");

  if (!Array.isArray(subsection.tasks)) {
    subsection.tasks = [];
  }

  subsection.tasks
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .forEach(function (task, taskIndex) {
      body.appendChild(renderTask(subsection, task, taskIndex));
    });

  const addTaskBtn = el("button", "btn-small-outline", "＋ Add Task");
  addTaskBtn.style.marginTop = "6px";
  addTaskBtn.addEventListener("click", function () {
    addTask(subsection);
  });

  body.appendChild(addTaskBtn);
  container.appendChild(body);

  return container;
}

// =============================================================
// TASK RENDER
// =============================================================

function renderTask(subsection, task, taskIndex) {
  const wrapper = el("div", "admin-task");

  // Top row: label + controls
  const topRow = el("div", "admin-task-toprow");

  const label = el("span", "admin-task-label", "Task");
  topRow.appendChild(label);

  const controls = el("div", "admin-arrow-group");

  const upBtn = el("button", "btn-arrow", "▲");
  upBtn.title = "Move task up";
  upBtn.addEventListener("click", function () {
    moveUp(subsection.tasks, taskIndex);
    renderAdminUI();
  });

  const downBtn = el("button", "btn-arrow", "▼");
  downBtn.title = "Move task down";
  downBtn.addEventListener("click", function () {
    moveDown(subsection.tasks, taskIndex);
    renderAdminUI();
  });

  const dupBtn = el("button", "btn-arrow");
  dupBtn.innerHTML = "⧉";
  dupBtn.title = "Duplicate task";
  dupBtn.addEventListener("click", function () {
    duplicateTask(subsection, task);
  });

  const delBtn = el("button", "btn-delete", "✕");
  delBtn.title = "Delete task";
  delBtn.addEventListener("click", function () {
    if (!confirm("Delete this task?")) return;
    subsection.tasks.splice(taskIndex, 1);
    renumber(subsection.tasks);
    renderAdminUI();
  });

  controls.appendChild(upBtn);
  controls.appendChild(downBtn);
  controls.appendChild(dupBtn);
  controls.appendChild(delBtn);

  topRow.appendChild(controls);
  wrapper.appendChild(topRow);

  // Task description textarea
  const textArea = el("textarea", "admin-task-textarea");
  textArea.value = task.text || "";
  textArea.placeholder = "Task description";

  if (task._height) {
    textArea.style.height = task._height + "px";
  }
  autoresize(textArea);

  textArea.addEventListener("input", function () {
    task.text = textArea.value;
    task._height = textArea.scrollHeight;
    autoresize(textArea);
    saveMasterDraft();
  });

  wrapper.appendChild(textArea);

  // Note label
  const noteLabel = el(
    "div",
    "admin-task-label",
    "Master note (optional guidance / URL)"
  );
  wrapper.appendChild(noteLabel);

  // Note textarea
  const noteArea = el("textarea", "admin-task-notearea");
  noteArea.value = task.note || "";
  noteArea.placeholder = "Optional guidance, URL, or extra info";

  if (task._noteHeight) {
    noteArea.style.height = task._noteHeight + "px";
  }
  autoresize(noteArea);

  noteArea.addEventListener("input", function () {
    task.note = noteArea.value;
    task._noteHeight = noteArea.scrollHeight;
    autoresize(noteArea);
    saveMasterDraft();
  });

  wrapper.appendChild(noteArea);

  return wrapper;
}

// =============================================================
// ADD / DUPLICATE
// =============================================================

function addSection() {
  if (!Array.isArray(currentMaster.sections)) {
    currentMaster.sections = [];
  }
  const newSection = {
    id: makeId("sec"),
    title: "New Section",
    order: currentMaster.sections.length + 1,
    subsections: [],
    _collapsed: false
  };
  currentMaster.sections.push(newSection);
  saveMasterDraft();
  renderAdminUI();
}

function addSubsection(section) {
  if (!Array.isArray(section.subsections)) {
    section.subsections = [];
  }
  const newSub = {
    id: makeId("sub"),
    title: "New Subsection",
    order: section.subsections.length + 1,
    tasks: [],
    _collapsed: false
  };
  section.subsections.push(newSub);
  saveMasterDraft();
  renderAdminUI();
}

function addTask(subsection) {
  if (!Array.isArray(subsection.tasks)) {
    subsection.tasks = [];
  }
  const newTask = {
    id: makeId("task"),
    order: subsection.tasks.length + 1,
    text: "New task",
    note: ""
  };
  subsection.tasks.push(newTask);
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
  if (!Array.isArray(section.subsections)) {
    section.subsections = [];
  }
  const clone = JSON.parse(JSON.stringify(subsection));
  clone.id = makeId("sub");
  section.subsections.push(clone);
  renumber(section.subsections);
  renderAdminUI();
}

function duplicateTask(subsection, task) {
  if (!Array.isArray(subsection.tasks)) {
    subsection.tasks = [];
  }
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
  const overlay = el("div", "admin-modal-backdrop");
  const modal = el("div", "admin-modal");

  const h2 = el("h2", null, "Export Master Template JSON");
  const p = el(
    "p",
    null,
    'Copy this JSON into "master-template.js" as window.MASTER_CHECKLIST and commit to GitHub.'
  );

  const textarea = el("textarea", "admin-modal-textarea");
  textarea.value = JSON.stringify(currentMaster, null, 2);

  const closeBtn = el("button", "btn-primary", "Close");
  closeBtn.addEventListener("click", function () {
    document.body.removeChild(overlay);
  });

  modal.appendChild(h2);
  modal.appendChild(p);
  modal.appendChild(textarea);
  modal.appendChild(closeBtn);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

