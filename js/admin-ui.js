// ----------------------------------------------------
// Admin Mode UI — Master Template Editor
// ----------------------------------------------------
// v1.1 — Material-You style, reorder + delete + autosave
// ----------------------------------------------------

const MASTER_DRAFT_KEY = "masterChecklistDraftV1";
let currentMaster = null;

// ----------------------------------------------------
// Init & Draft Handling
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
    console.warn("Error loading master draft, falling back to default", e);
  }

  // Fallback: deep-clone the shipped MASTER_CHECKLIST
  currentMaster = JSON.parse(JSON.stringify(window.MASTER_CHECKLIST));
  saveMasterDraft();
}

function saveMasterDraft() {
  try {
    localStorage.setItem(MASTER_DRAFT_KEY, JSON.stringify(currentMaster));
  } catch (e) {
    console.warn("Error saving master draft", e);
  }
}

function resetMasterDraftToOriginal() {
  if (!confirm("Reset draft to original MASTER_CHECKLIST? This cannot be undone.")) return;
  currentMaster = JSON.parse(JSON.stringify(window.MASTER_CHECKLIST));
  saveMasterDraft();
  renderAdminUI();
}

// ----------------------------------------------------
// Reorder / Delete helpers
// ----------------------------------------------------

function moveUp(list, index) {
  if (!Array.isArray(list)) return;
  if (index <= 0 || index >= list.length) return;
  const tmp = list[index - 1];
  list[index - 1] = list[index];
  list[index] = tmp;
  renumber(list);
}

function moveDown(list, index) {
  if (!Array.isArray(list)) return;
  if (index < 0 || index >= list.length - 1) return;
  const tmp = list[index + 1];
  list[index + 1] = list[index];
  list[index] = tmp;
  renumber(list);
}

function renumber(list) {
  if (!Array.isArray(list)) return;
  list.forEach((item, i) => {
    item.order = i + 1;
  });
  saveMasterDraft();
}

// delete helpers

function deleteSection(sectionIndex) {
  if (!confirm("Delete this section and all its subsections and tasks?")) return;
  if (!Array.isArray(currentMaster.sections)) return;
  currentMaster.sections.splice(sectionIndex, 1);
  renumber(currentMaster.sections);
  renderAdminUI();
}

function deleteSubsection(section, subIndex) {
  if (!confirm("Delete this subsection and all its tasks?")) return;
  if (!Array.isArray(section.subsections)) return;
  section.subsections.splice(subIndex, 1);
  renumber(section.subsections);
  renderAdminUI();
}

function deleteTask(subsection, taskIndex) {
  if (!confirm("Delete this task?")) return;
  if (!Array.isArray(subsection.tasks)) return;
  subsection.tasks.splice(taskIndex, 1);
  renumber(subsection.tasks);
  renderAdminUI();
}

// ----------------------------------------------------
// Main Render
// ----------------------------------------------------

function renderAdminUI() {
  const app = qs("#app");
  app.innerHTML = "";

  // ----- Header card -----
  const header = el("div", "card admin-header");
  header.innerHTML = `
    <h1>Admin – Master Template</h1>
    <p>Edit sections, subsections & tasks. Changes are saved locally as a draft.</p>
  `;

  const btnRow = el("div", "admin-header-buttons");

  const exportBtn = el("button", "btn-primary", "Export JSON");
  exportBtn.addEventListener("click", showExportModal);

  const resetBtn = el("button", "btn-secondary", "Reset draft to original");
  resetBtn.addEventListener("click", resetMasterDraftToOriginal);

  const addSectionBtn = el("button", "btn-primary-outline", "＋ Add Section");
  addSectionBtn.addEventListener("click", addSection);

  btnRow.appendChild(exportBtn);
  btnRow.appendChild(resetBtn);
  btnRow.appendChild(addSectionBtn);

  header.appendChild(btnRow);
  app.appendChild(header);

  // ----- Sections -----
  if (!Array.isArray(currentMaster.sections)) {
    currentMaster.sections = [];
  }

  currentMaster.sections
    .slice() // copy to avoid in-place sort side effects
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .forEach((section, sectionIndex) => {
      app.appendChild(renderSection(section, sectionIndex));
    });

  // Bottom add section card
  const bottomCard = el("div", "card admin-add-section-bottom");
  const bottomBtn = el("button", "btn-primary-outline full-width", "＋ Add Section");
  bottomBtn.addEventListener("click", addSection);
  bottomCard.appendChild(bottomBtn);
  app.appendChild(bottomCard);
}

// ----------------------------------------------------
// Section Render
// ----------------------------------------------------

function renderSection(section, sectionIndex) {
  const card = el("div", "card admin-section-card");

  // Header, tinted background
  const header = el("div", "admin-section-header");

  const titleInput = el("input", "admin-section-title-input");
  titleInput.value = section.title || "";
  titleInput.placeholder = "Section title";
  titleInput.addEventListener("input", () => {
    section.title = titleInput.value;
    saveMasterDraft();
  });

  const titleWrap = el("div", "admin-section-title-wrap");
  titleWrap.appendChild(titleInput);

  const actions = el("div", "admin-header-actions");

  // Arrows
  const arrowGroup = el("div", "admin-arrow-group");
  const upBtn = el("button", "btn-arrow", "▲");
  const downBtn = el("button", "btn-arrow", "▼");

  upBtn.title = "Move section up";
  downBtn.title = "Move section down";

  upBtn.addEventListener("click", () => {
    moveUp(currentMaster.sections, sectionIndex);
    renderAdminUI();
  });

  downBtn.addEventListener("click", () => {
    moveDown(currentMaster.sections, sectionIndex);
    renderAdminUI();
  });

  arrowGroup.appendChild(upBtn);
  arrowGroup.appendChild(downBtn);

  // Delete
  const deleteBtn = el("button", "btn-delete", "✕");
  deleteBtn.title = "Delete section";
  deleteBtn.addEventListener("click", () => {
    deleteSection(sectionIndex);
  });

  actions.appendChild(arrowGroup);
  actions.appendChild(deleteBtn);

  header.appendChild(titleWrap);
  header.appendChild(actions);

  card.appendChild(header);

  // ----- Subsections -----
  const subsContainer = el("div", "admin-subsections");
  if (!Array.isArray(section.subsections)) {
    section.subsections = [];
  }

  section.subsections
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .forEach((subsection, subIndex) => {
      subsContainer.appendChild(renderSubsection(section, subsection, subIndex));
    });

  card.appendChild(subsContainer);

  const addSubBtn = el("button", "btn-small-outline", "＋ Add Subsection");
  addSubBtn.addEventListener("click", () => addSubsection(section));
  card.appendChild(addSubBtn);

  return card;
}

// ----------------------------------------------------
// Subsection Render
// ----------------------------------------------------

function renderSubsection(section, subsection, subIndex) {
  const block = el("div", "admin-subsection");

  const header = el("div", "admin-subsection-header");

  const titleInput = el("input", "admin-subsection-title-input");
  titleInput.value = subsection.title || "";
  titleInput.placeholder = "Subsection title";
  titleInput.addEventListener("input", () => {
    subsection.title = titleInput.value;
    saveMasterDraft();
  });

  const titleWrap = el("div", "admin-subsection-title-wrap");
  titleWrap.appendChild(titleInput);

  const actions = el("div", "admin-header-actions");

  const arrowGroup = el("div", "admin-arrow-group");
  const upBtn = el("button", "btn-arrow", "▲");
  const downBtn = el("button", "btn-arrow", "▼");

  upBtn.title = "Move subsection up";
  downBtn.title = "Move subsection down";

  upBtn.addEventListener("click", () => {
    moveUp(section.subsections, subIndex);
    renderAdminUI();
  });

  downBtn.addEventListener("click", () => {
    moveDown(section.subsections, subIndex);
    renderAdminUI();
  });

  arrowGroup.appendChild(upBtn);
  arrowGroup.appendChild(downBtn);

  const deleteBtn = el("button", "btn-delete", "✕");
  deleteBtn.title = "Delete subsection";
  deleteBtn.addEventListener("click", () => {
    deleteSubsection(section, subIndex);
  });

  actions.appendChild(arrowGroup);
  actions.appendChild(deleteBtn);

  header.appendChild(titleWrap);
  header.appendChild(actions);

  block.appendChild(header);

  // ----- Tasks -----
  const tasksContainer = el("div", "admin-tasks");

  if (!Array.isArray(subsection.tasks)) {
    subsection.tasks = [];
  }

  subsection.tasks
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .forEach((task, taskIndex) => {
      tasksContainer.appendChild(renderTask(subsection, task, taskIndex));
    });

  block.appendChild(tasksContainer);

  const addTaskBtn = el("button", "btn-small-outline", "＋ Add Task");
  addTaskBtn.addEventListener("click", () => addTask(subsection));
  block.appendChild(addTaskBtn);

  return block;
}

// ----------------------------------------------------
// Task Render
// ----------------------------------------------------

function renderTask(subsection, task, taskIndex) {
  const wrapper = el("div", "admin-task");

  const topRow = el("div", "admin-task-toprow");

  const label = el("span", "admin-task-label", "Task");

  const actions = el("div", "admin-header-actions");
  const arrowGroup = el("div", "admin-arrow-group");

  const upBtn = el("button", "btn-arrow", "▲");
  const downBtn = el("button", "btn-arrow", "▼");

  upBtn.title = "Move task up";
  downBtn.title = "Move task down";

  upBtn.addEventListener("click", () => {
    moveUp(subsection.tasks, taskIndex);
    renderAdminUI();
  });

  downBtn.addEventListener("click", () => {
    moveDown(subsection.tasks, taskIndex);
    renderAdminUI();
  });

  arrowGroup.appendChild(upBtn);
  arrowGroup.appendChild(downBtn);

  const deleteBtn = el("button", "btn-delete", "✕");
  deleteBtn.title = "Delete task";
  deleteBtn.addEventListener("click", () => {
    deleteTask(subsection, taskIndex);
  });

  actions.appendChild(arrowGroup);
  actions.appendChild(deleteBtn);

  topRow.appendChild(label);
  topRow.appendChild(actions);

  // Task description
  const textArea = el("textarea", "admin-task-textarea");
  textArea.value = task.text || "";
  textArea.placeholder = "Task description (can be multi-line)";
  textArea.addEventListener("input", () => {
    task.text = textArea.value;
    saveMasterDraft();
  });

  // Optional note / guidance
  const noteLabel = el("label", "admin-task-label", "Master note (optional guidance / URL)");
  const noteArea = el("textarea", "admin-task-textarea admin-task-notearea");
  noteArea.value = task.note || "";
  noteArea.placeholder = "Optional guidance, URL, or explanation for this task.";
  noteArea.addEventListener("input", () => {
    task.note = noteArea.value;
    saveMasterDraft();
  });

  wrapper.appendChild(topRow);
  wrapper.appendChild(textArea);
  wrapper.appendChild(noteLabel);
  wrapper.appendChild(noteArea);

  return wrapper;
}

// ----------------------------------------------------
// Add helpers
// ----------------------------------------------------

function addSection() {
  if (!Array.isArray(currentMaster.sections)) {
    currentMaster.sections = [];
  }
  const newSection = {
    id: makeId("sec"),
    title: "New Section",
    order: currentMaster.sections.length + 1,
    subsections: []
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
    tasks: []
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
    text: "New task",
    note: "",
    order: subsection.tasks.length + 1
  };
  subsection.tasks.push(newTask);
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

  const title = el("h2", null, "Export Master Template JSON");
  const info = el(
    "p",
    null,
    "Copy this JSON into master-template.js, replacing window.MASTER_CHECKLIST, then commit to GitHub."
  );

  const textarea = el("textarea", "admin-modal-textarea");
  textarea.value = json;

  const closeBtn = el("button", "btn-primary", "Close");
  closeBtn.addEventListener("click", () => {
    document.body.removeChild(overlay);
  });

  modal.appendChild(title);
  modal.appendChild(info);
  modal.appendChild(textarea);
  modal.appendChild(closeBtn);
  overlay.appendChild(modal);

  document.body.appendChild(overlay);
}

