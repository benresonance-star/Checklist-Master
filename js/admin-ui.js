// ----------------------------------------------------
// Admin Mode UI - edit master template in the browser
// ----------------------------------------------------
// v0: local only (no Supabase yet)
// ----------------------------------------------------

const MASTER_DRAFT_KEY = "masterChecklistDraftV1";

let currentMaster = null;

function initAdminUI() {
  // For now we skip auth: this is just a local admin tool
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
    .sort((a, b) => a.order - b.order)
    .forEach((section) => {
      app.appendChild(renderAdminSection(section));
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

// ---------------- Section / Subsection / Task rendering ----------------

function renderAdminSection(section) {
  const card = el("div", "card admin-section-card");

  // Section title input
  const titleInput = el("input", "admin-section-title-input");
  titleInput.value = section.title || "";
  titleInput.placeholder = "Section title";

  titleInput.addEventListener("input", () => {
    section.title = titleInput.value;
    saveMasterDraft();
  });

  const sectionHeader = el("div", "admin-section-header");
  sectionHeader.appendChild(titleInput);

  // (Future: section-level actions like delete, move up/down)
  card.appendChild(sectionHeader);

  // Subsections
  const subsContainer = el("div", "admin-subsections");
  section.subsections
    .sort((a, b) => a.order - b.order)
    .forEach((sub) => {
      subsContainer.appendChild(renderAdminSubsection(section, sub));
    });
  card.appendChild(subsContainer);

  const addSubBtn = el("button", "btn-small-outline", "＋ Add Subsection");
  addSubBtn.addEventListener("click", () => {
    addSubsection(section);
  });
  card.appendChild(addSubBtn);

  return card;
}

function renderAdminSubsection(section, subsection) {
  const block = el("div", "admin-subsection");

  const header = el("div", "admin-subsection-header");
  const titleInput = el("input", "admin-subsection-title-input");
  titleInput.value = subsection.title || "";
  titleInput.placeholder = "Subsection title";

  titleInput.addEventListener("input", () => {
    subsection.title = titleInput.value;
    saveMasterDraft();
  });

  header.appendChild(titleInput);
  block.appendChild(header);

  // Tasks list
  const tasksContainer = el("div", "admin-tasks");
  subsection.tasks
    .sort((a, b) => a.order - b.order)
    .forEach((task) => {
      tasksContainer.appendChild(renderAdminTask(subsection, task));
    });

  block.appendChild(tasksContainer);

  const addTaskBtn = el("button", "btn-small-outline", "＋ Add Task");
  addTaskBtn.addEventListener("click", () => {
    addTask(subsection);
  });
  block.appendChild(addTaskBtn);

  return block;
}

function renderAdminTask(subsection, task) {
  const wrapper = el("div", "admin-task");

  // Task description
  const label = el("label", "admin-task-label");
  label.textContent = "Task description";

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

  wrapper.appendChild(label);
  wrapper.appendChild(textarea);
  wrapper.appendChild(noteLabel);
  wrapper.appendChild(noteArea);

  return wrapper;
}

// ---------------- Add section / subsection / task ----------------

function addSection() {
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
  const newSub = {
    id: makeId("sub"),
    title: "New Subsection",
    order: (section.subsections?.length || 0) + 1,
    tasks: []
  };
  section.subsections = section.subsections || [];
  section.subsections.push(newSub);
  saveMasterDraft();
  renderAdminUI();
}

function addTask(subsection) {
  const newTask = {
    id: makeId("task"),
    order: (subsection.tasks?.length || 0) + 1,
    text: "New task",
    note: ""
  };
  subsection.tasks = subsection.tasks || [];
  subsection.tasks.push(newTask);
  saveMasterDraft();
  renderAdminUI();
}

// ---------------- Export modal ----------------

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

