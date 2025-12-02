// ----------------------------------------------------
// Admin Mode UI - edit master template in the browser
// ----------------------------------------------------
// v0.3: local-only admin with ▲ / ▼ reordering + delete
// ----------------------------------------------------

const MASTER_DRAFT_KEY = "masterChecklistDraftV1";

let currentMaster = null;

// ---------- Init & draft handling ----------

function initAdminUI() {
  // No auth yet – just a local admin tool
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
    console.warn("Failed to load master draft, falling back to default.", e);
  }

  // Deep clone initial MASTER_CHECKLIST as starting draft
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

function resetMasterDraftToOriginal() {
  if (!confirm("Reset draft to original MASTER_CHECKLIST? This cannot be undone.")) {
    return;
  }
  currentMaster = JSON.parse(JSON.stringify(window.MASTER_CHECKLIST));
  saveMasterDraft();
  renderAdminUI();
}

// ---------- Reorder helpers (simple ▲ / ▼) ----------

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
  list.forEach((item, i) => {
    item.order = i + 1;
  });
  saveMasterDraft();
}

// ---------- Delete helpers ----------

function deleteSection(sectionIndex) {
  if (!confirm("Delete this section and all its subsections and tasks?")) return;
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

// ---------- Main render ----------

function renderAdminUI() {
  const app = qs("#app");
  app.innerHTML = "";

  // --- Header ---
  const header = el("div", "card admin-header");
  header.innerHTML = `
    <h1>Admin – Master Template</h1>
    <p>Edit sections, subsections and tasks. Changes are saved locally as a draft.</p>
  `;

  const btnRow = el("div", "admin-header-buttons");

  const exportBtn = el("button", "btn-primary", "Export JSON");
  exportBtn.addEventListener("click", showExportModal);

  const resetBtn = el("button", "btn-secondary", "Reset draft to original");
  resetBtn.addEventListener("click", resetMasterDraftToOriginal);

  const addSectionBtnTop = el("button", "btn-primary-outline", "＋ Add Section");
  addSectionBtnTop.addEventListener("click", () => {
    addSection();
  });

  btnRow.appendChild(exportBtn);
  btnRow.appendChild(resetBtn);
  btnRow.appendChild(addSectionBtnTop);
  header.appendChild(btnRow);
  app.appendChild(header);

  // --- Sections ---
  currentMaster.sections
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .forEach((section, sIndex) => {
      app.appendChild(renderAdminSection(section, sIndex));
    });

  // Add-section button at bottom too
  const addSectionBtnBottom = el("button", "btn-primary-outline full-width", "＋ Add Section");
  addSectionBtnBottom.addEventListener("click", () => {
    addSection();
  });
  const addSectionWrapper = el("div", "card admin-add-section-bottom");
  addSectionWrapper.appendChild(addSectionBtnBottom);
  app.appendChild(addSectionWrapper);
}

// ---------- Section / Subsection / Task rendering ----------

function renderAdminSection(section, sectionIndex) {
  const card = el("div", "card admin-section-card");

  const header = el("div", "admin-section-header");

  // Left: title
  const titleInput = el("input", "admin-section-title-input");
  titleInput.value = section.title || "";
  titleInput.placeholder = "Section title";

  titleInput.addEventListener("input", () => {
    section.title = titleInput.value;
    saveMasterDraft();
  });

  const titleWrap = el("div", "admin-section-title-wrap");
  titleWrap.appendChild(titleInput);

  // Right: actions (▲ / ▼ + delete)
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

  // Subsections
  const subsContainer = el("div", "admin-subsections");
  (section.subsections || [])
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .forEach((sub, subIndex) => {
      subsContainer.appendChild(renderAdminSubsection(section, sub, subIndex));
    });
  card.appendChild(subsContainer);

  const addSubBtn = el("button", "btn-small-outline", "＋ Add Subsection");
  addSubBtn.addEventListener("click", () => {
    addSubsection(section);
  });
  card.appendChild(addSubBtn);

  return card;
}

function renderAdminSubsection(section, subsection, subIndex) {
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

  // Right side: arrows + delete
  const actions = el("div", "admin-header-actions");

  const arrowGroup = el("div", "admin-arrow-group");
  const upBtn = el("button", "btn-arrow", "▲");
  const downBtn = el("button", "btn-arrow", "▼");

  upBtn.title = "Move subsection up";
  downBtn.title = "Move subsection down";

  upBtn.addEventListener("click", () => {
    section.subsections = section.subsections || [];
    moveUp(section.subsections, subIndex);
    renderAdminUI();
  });

  downBtn.addEventListener("click", () => {
    section.subsections = section.subsections || [];
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

  // Tasks list
  const tasksContainer = el("div", "admin-tasks");
  (subsection.tasks || [])
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .forEach((task, tIndex) => {
      tasksContainer.appendChild(renderAdminTask(subsection, task, tIndex));
    });

  block.appendChild(tasksContainer);

  const addTaskBtn = el("button", "btn-small-outline", "＋ Add Task");
  addTaskBtn.addEventListener("click", () => {
    addTask(subsection);
  });
  block.appendChild(addTaskBtn);

  return block;
}

function renderAdminTask(subsection, task, taskIndex) {
  const wrapper = el("div", "admin-task");

  // Header row: label + arrows + delete
  const topRow = el("div", "admin-task-toprow");

  const label = el("span", "admin-task-label");
  label.textContent = "Task";

  const actions = el("div", "admin-header-actions");

  const arrowGroup = el("div", "admin-arrow-group");
  const upBtn = el("button", "btn-arrow", "▲");
  const downBtn = el("button", "btn-arrow", "▼");

  upBtn.title = "Move task up";
  downBtn.title = "Move task down";

  upBtn.addEventListener("click", () => {
    subsection.tasks = subsection.tasks || [];
    moveUp(subsection.tasks, taskIndex);
    renderAdminUI();
  });

  downBtn.addEventListener("click", () => {
    subsection.tasks = subsection.tasks || [];
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

  // Task description textarea
  const textarea = el("textarea", "admin-task-textarea");
  textarea.value = task.text || "";
  textarea.placeholder = "Task description (can be multi-line)";
  textarea.addEventListener("input", () => {
    task.text = textarea.value;
    saveMasterDraft();
  });

  // Master note
  const noteLabel = el("label", "admin-task-label");
  noteLabel.textContent = "Master note (optional guidance / URL)";

  const noteArea = el("textarea", "admin-task-textarea admin-task-notearea");
  noteArea.value = task.note || "";
  noteArea.placeholder = "Optional guidance, URL, or explanation for this task.";
  noteArea.addEventListener("input", () => {
    task.note = noteArea.value;
    saveMasterDraft();
  });

  wrapper.appendChild(topRow);
  wrapper.appendChild(textarea);
  wrapper.appendChild(noteLabel);
  wrapper.appendChild(noteArea);

  return wrapper;
}

// ---------- Add section / subsection / task ----------

function addSection() {
  const newSection = {
    id: makeId("sec"),
    title: "New Section",
    order: (currentMaster.sections?.length || 0) + 1,
    subsections: []
  };
  currentMaster.sections = currentMaster.sections || [];
  currentMaster.sections.push(newSection);
  saveMasterDraft();
  renderAdminUI();
}

function addSubsection(section) {
  section.subsections = section.subsections || [];
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
  subsection.tasks = subsection.tasks || [];
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

// ---------- Export modal ----------

function showExportModal() {
  const json = JSON.stringify(currentMaster, null, 2);

  const overlay = el("div", "admin-modal-backdrop");
  const modal = el("div", "admin-modal");

  const title = el("h2", "");
  title.textContent = "Export Master Template JSON";

  const info = el("p", "");
  info.innerHTML = `
    Copy this JSON and paste it into <code>master-template.js</code>
    (replacing the existing <code>window.MASTER_CHECKLIST</code> object),
    then commit to GitHub to publish the updated template.
  `;

  const textarea = el("textarea", "admin-modal-textarea");
  textarea.value = json;

  const closeBtn = el("button", "btn-primary");
  closeBtn.textContent = "Close";
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
