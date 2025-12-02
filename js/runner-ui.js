// ----------------------------------------------------
// Runner Mode UI - local demo (no Supabase required)
// ----------------------------------------------------

function initRunnerUI() {
  // For now: ignore Supabase and instanceId, just render
  // the master template with localStorage-backed state.

  const LOCAL_KEY = "checklistDemoInstanceV1";

  // Load existing local state, or create empty
  let instance = null;
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    instance = raw ? JSON.parse(raw) : { taskState: {} };
  } catch (e) {
    instance = { taskState: {} };
  }

  const merged = mergeMasterWithInstance(window.MASTER_CHECKLIST, instance);

  // Keep in memory so handlers can update it
  window._currentInstance = merged;
  window._currentInstanceKey = LOCAL_KEY;

  renderRunnerUI(merged);
}

function renderRunnerUI(merged) {
  const app = qs("#app");
  app.innerHTML = "";

  const header = el("div", "card");
  header.innerHTML = `
    <h1>${merged.title}</h1>
    <p style="margin-top:4px;font-size:0.9rem;color:#555;">
      Local demo instance (saved in this browser only).
    </p>
  `;
  app.appendChild(header);

  merged.sections
    .sort((a, b) => a.order - b.order)
    .forEach((section) => {
      const card = el("div", "card");
      const h2 = el("h2", "");
      h2.textContent = section.title;
      card.appendChild(h2);

      section.subsections
        .sort((a, b) => a.order - b.order)
        .forEach((sub) => {
          const h3 = el("h3", "");
          h3.textContent = sub.title;
          card.appendChild(h3);

          sub.tasks
            .sort((a, b) => a.order - b.order)
            .forEach((task) => {
              const state = merged.taskState[task.id];
              card.appendChild(renderTaskRow(task, state));
            });
        });

      app.appendChild(card);
    });
}

function renderTaskRow(task, state) {
  const row = el("div", "task-row");

  const checkbox = el("input");
  checkbox.type = "checkbox";
  checkbox.checked = state.completed;

  checkbox.addEventListener("change", () => {
    state.completed = checkbox.checked;
    saveCurrentInstance();
    // update style
    if (state.completed) {
      text.classList.add("completed");
    } else {
      text.classList.remove("completed");
    }
  });

const text = el("div", "task-text");
text.textContent = task.text;
if (state.completed) text.classList.add("completed");

// Master note (template) goes *inside* the text block, beneath the main line
if (task.note) {
  const masterNote = el("div", "task-note");
  masterNote.textContent = "Guide: " + task.note;
  text.appendChild(masterNote);
}

row.appendChild(checkbox);
row.appendChild(text);

  return row;
}

function saveCurrentInstance() {
  if (!window._currentInstance || !window._currentInstanceKey) return;
  const payload = {
    taskState: window._currentInstance.taskState,
  };
  try {
    localStorage.setItem(
      window._currentInstanceKey,
      JSON.stringify(payload)
    );
  } catch (e) {
    console.warn("Failed to save demo instance", e);
  }
}


