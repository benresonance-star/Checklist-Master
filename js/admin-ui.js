// ----------------------------------------------------
// Admin Mode UI — Master Template Editor
// ----------------------------------------------------
// v1.2 — collapse toggles, duplicate, autofocus, prune-on-export
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
  currentMaster = deepClone(window.MASTER_CHECKLIST);
  saveMasterDraft();
}

function saveMasterDraft() {
  try {
    localStorage.setItem(MASTER_DRAFT_KEY, JSON.stringify(currentMaster));
  } catch (e) {
    console.warn("Error saving master draft", e);
  }
}

// Still available if we want to wire a button later
function resetMasterDraftToOriginal() {
  if (!confirm("Reset draft to original MASTER_CHECKLIST? This cannot be undone.")) return;
  currentMaster = deepClone(window.MASTER_CHECKLIST);
  saveMasterDraft();
  renderAdminUI();
}

// Simple deep-clone helper
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// ----------------------------------------------------
// Reorder / Delete / Duplicate helpers
// ----------------------------------------------------

function moveUp(list, index) {
  if (!Array.isArray(list)) return;
  if (index <= 0 || index >= list.length) return;
  [list[index - 1], list[index]] = [list[index], list[index - 1]];
  renumber(list);
}

function moveDown(list, index) {
  if (!Array.isArray(list)) return;
  if (index < 0 || index >= list.length - 1) return;
  [list[index + 1], list[index]] = [list[index], list[index + 1]];
  renumber(list);
}

function renumber(list) {
  if (!Array.isArray(list)) return;
  list.forEach((item, i) => {
    item.order = i + 1;
  });
  saveMasterDraft();
}

// Delete helpers

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

// Duplicate helpers

function duplicateSection(sectionIndex) {
  if (!Array.isArray(currentMaster.sections)) return;
  const original = currentMaster.sections[sectionIndex];
  if (!original) return;

  const clone = deepClone(original);
  reassignSectionIds(clone);

  currentMaster.sections.splice(sectionIndex + 1, 0, clone);
  renumber(currentMaster.sections);
  saveMasterDraft();
  renderAdminUI();
  focusAndScroll(`[data-section-id="${clone.id}"] .admin-section-title-input`);
}

function duplicateSubsection(section, subIndex) {
  if (!Array.isArray(section.subsections)) return;
  const original = section.subsections[subIndex];
  if (!original) return;

  const clone = deepClone(original);
  clone.id = makeId("sub");
  if (Array.isArray(clone.tasks)) {
    clone.tasks.forEach((t) => {
      t.id = makeId("task");
    });
  }

  section.subsections.splice(subIndex + 1, 0, clone);
  renumber(section.subsections);
  saveMasterDraft();
  renderAdminUI();
  focusAndScroll(`[data-subsection-id="${clone.id}"] .admin-subsection-title-input`);
}

function duplicateTask(subsection, taskIndex) {
  if (!Array.isArray(subsection.tasks)) return;
  const original = subsection.tasks[taskIndex];
  if (!original) return;

  const clone = deepClone(original);
  clone.id = makeId("task");

  subsection.tasks.splice(taskIndex + 1, 0, clone);
  renumber(subsection.tasks);
  saveMasterDraft();
  renderAdminUI();
  focusAndScroll(`[data-task-id="${clone.id}"] .admin-task-textarea`);
}

// Reassign IDs for a whole section hierarchy
function reassignSectionIds(section) {
  section.id = makeId("sec");
  if (Array.isArray(section.subsections)) {
    section.subsections.forEach((sub) => {
      sub.id = makeId("sub");
      if (Array.isArray(sub.tasks)) {
        sub.tasks.forEach((task) => {
          task.id = makeId("task");
        });
      }
    });
  }
}

// ----------------------------------------------------
// Focus + Scroll helper (for new / duplicated items)
// ----------------------------------------------------

function focusAndScroll(selector) {
  const node = document.querySelector(selector);
  if (!node) return;
  node.focus();
  try {
    node.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (_) {
    // Older browsers: ignore
  }
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
    <p>Edit sections, subsections & tasks. Changes autosave locally.</p>
  `;

  const btnRow = el("div", "admin-header-buttons");

  // Only Export JSON at top (no reset, no add-section)
  const exportBtn = el("button", "btn-primary", "Export JSON");
  exportBtn.addEventListener("click", showExportModal);

  btnRow.appendChild(exportBtn);
  header.appendChild(btnRow);
  app.appendChild(header);

  // ----- Sections -----
  if (!Array.isArray(currentMaster.sections)) {
    currentMaster.sections = [];
  }

  currentMaster.sections
    .slice()
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
  card.setAttribute("data-section-id", section.id || "");

  // Header with toggle
  const header = el("div", "admin-section-header");

  const left = el("div", "admin-section-left");

  const toggleBtn = el("button", "btn-arrow btn-toggle", section.collapsed ? "▸" : "▾");
  toggleBtn.title = section.collapsed ? "Expand section" : "Collapse section";
  toggleBtn.addEventListener("click", () => {
    section.collapsed = !section.collapsed;
    saveMasterDraft();
    renderAdminUI();
  });

  const titleInput = el("input", "admin-section-title-input");
  titleInput.value = section.title || "";
  titleInput.placeholder = "Section title";
  titleInput.addEventListener("input", () => {
    section.title = titleInput.value;
    saveMasterDraft();
  });

  const titleWrap = el("div", "admin-section-title-wrap");
  titleWrap.appendChild(titleInput);

  left.appendChild(toggleBtn);
  left.appendChild(titleWrap);

  const actions = el("div", "admin-header-actions");

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

  const duplicateBtn = el("button", "btn-arrow", "⧉");
  duplicateBtn.title = "Duplicate section";
  duplicateBtn.addEventListener("click", () => {
    duplicateSection(sectionIndex);
  });

  const deleteBtn = el("button", "btn-delete", "✕");
  deleteBtn.title = "Delete section";
  deleteBtn.addEventListener("click", () => {
    deleteSection(sectionIndex);
  });

  actions.appendChild(arrowGroup);
  actions.appendChild(duplicateBtn);
  actions.appendChild(deleteBtn);

  header.appendChild(left);
  header.appendChild(actions);

  card.appendChild(header);

  // Body (collapsible)
  const body = el("div", "admin-section-body");
  if (section.collapsed) {
    body.style.display = "none";
    card.appendChild(body);
    return card;
  }

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

  body.appendChild(subsContainer);

  const addSubBtn = el("button", "btn-small-outline", "＋ Add Subsection");
  addSubBtn.addEventListener("click", () => addSubsection(section));
  body.appendChild(addSubBtn);

  card.appendChild(body);

  return card;
}

// ----------------------------------------------------
// Subsection Render
// ----------------------------------------------------

function renderSubsection(section, subsection, subIndex) {
  const block = el("div", "admin-subsection");
  block.setAttribute("data-subsection-id", subsection.id || "");

  const header = el("div", "admin-subsection-header");

  const left = el("div", "admin-subsection-left");

  const toggleBtn = el("button", "btn-arrow btn-toggle", subsection.collapsed ? "▸" : "▾");
  toggleBtn.title = subsection.collapsed ? "Expand subsection" : "Collapse subsection";
  toggleBtn.addEventListener("click", () => {
    subsection.collapsed = !subsection.collapsed;
    saveMasterDraft();
    renderAdminUI();
  });

  const titleInput = el("input", "admin-subsection-title-input");
  titleInput.value = subsection.title || "";
  titleInput.placeholder = "Subsection title";
  titleInput.addEventListener("input", () => {
    subsection.title = titleInput.value;
    saveMasterDraft();
  });

  const titleWrap = el("div", "admin-subsection-title-wrap");
  titleWrap.appendChild(titleInput);

  left.appendChild(toggleBtn);
  left.appendChild(titleWrap);

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

  const duplicateBtn = el("button", "btn-arrow", "⧉");
  duplicateBtn.title = "Duplicate subsection";
  duplicateBtn.addEventListener("click", () => {
    duplicateSubsection(section, subIndex);
  });

  const deleteBtn = el("button", "btn-delete", "✕");
  deleteBtn.title = "Delete subsection";
  deleteBtn.addEventListener("click", () => {
    deleteSubsection(section, subIndex);
  });

  actions.appendChild(arrowGroup);
  actions.appendChild(duplicateBtn);
  actions.appendChild(deleteBtn);

  header.appendChild(left);
  header.appendChild(actions);

  block.appendChild(header);

  const body = el("div", "admin-subsection-body");
  if (subsection.collapsed) {
    body.style.display = "none";
    block.appendChild(body);
    return block;
  }

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

  body.appendChild(tasksContainer);

  const addTaskBtn = el("button", "btn-small-outline", "＋ Add Task");
  addTaskBtn.addEventListener("click", () => addTask(subsection));
  body.appendChild(addTaskBtn);

  block.appendChild(body);

  return block;
}

// ----------------------------------------------------
// Task Render
// ----------------------------------------------------

function renderTask(subsection, task, taskIndex) {
  const wrapper = el("div", "admin-task");
  wrapper.setAttribute("data-task-id", task.id || "");

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

  const duplicateBtn = el("button", "btn-arrow", "⧉");
  duplicateBtn.title = "Duplicate task";
  duplicateBtn.addEventListener("click", () => {
    duplicateTask(subsection, taskIndex);
  });

  const deleteBtn = el("button", "btn-delete", "✕");
  deleteBtn.title = "Delete task";
  deleteBtn.addEventListener("click", () => {
    deleteTask(subsection, taskIndex);
  });

  actions.appendChild(arrowGroup);
  actions.appendChild(duplicateBtn);
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
// Add helpers (with autofocus + scroll)
// ----------------------------------------------------

function addSection() {
  if (!Array.isArray(currentMaster.sections)) {
    currentMaster.sections = [];
  }
  const newSection = {
    id: makeId("sec"),
    title: "New Section",
    order: currentMaster.sections.length + 1,
    subsections: [],
    collapsed: false
  };
  currentMaster.sections.push(newSection);
  saveMasterDraft();
  renderAdminUI();
  focusAndScroll(`[data-section-id="${newSection.id}"] .admin-section-title-input`);
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
    collapsed: false
  };
  section.subsections.push(newSub);
  saveMasterDraft();
  renderAdminUI();
  focusAndScroll(`[data-subsection-id="${newSub.id}"] .admin-subsection-title-input`);
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
  focusAndScroll(`[data-task-id="${newTask.id}"] .admin-task-textarea`);
}

// ----------------------------------------------------
// Export Modal (with prune of empty items)
// ----------------------------------------------------

function buildCleanMaster() {
  const copy = deepClone(currentMaster);
  copy.sections = (copy.sections || []).filter((section) => {
    section.title = (section.title || "").trim();
    section.subsections = (section.subsections || []).filter((sub) => {
      sub.title = (sub.title || "").trim();
      sub.tasks = (sub.tasks || []).filter((task) => {
        task.text = (task.text || "").trim();
        return !!task.text;
      });
      return sub.title || sub.tasks.length > 0;
    });
    return section.title || section.subsections.length > 0;
  });
  return copy;
}

function showExportModal() {
  const cleaned = buildCleanMaster();
  const json = JSON.stringify(cleaned, null, 2);

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

