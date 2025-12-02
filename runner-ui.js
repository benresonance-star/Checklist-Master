// ----------------------------------------------------
// Runner Mode UI - for normal users completing tasks
// ----------------------------------------------------

async function initRunnerUI() {
  const params = new URLSearchParams(window.location.search);
  const instanceId = params.get("instance");

  if (!instanceId) {
    document.body.innerHTML = "<h3>No instance specified</h3>";
    return;
  }

  const instance = await loadInstance(instanceId);
  const merged = mergeMasterWithInstance(window.MASTER_CHECKLIST, instance);

  renderRunnerUI(merged, instanceId);
}

function renderRunnerUI(merged, instanceId) {
  const app = qs("#app");
  app.innerHTML = "";

  merged.sections.forEach(section => {
    const card = el("div", "card");
    card.innerHTML = `<h2>${section.title}</h2>`;

    section.subsections.forEach(sub => {
      const subTitle = el("h3", "");
      subTitle.textContent = sub.title;
      card.appendChild(subTitle);

      sub.tasks.forEach(task => {
        card.appendChild(renderTaskRow(task, merged.taskState[task.id], instanceId));
      });
    });

    app.appendChild(card);
  });
}

function renderTaskRow(task, state, instanceId) {
  const row = el("div", "task-row");

  const checkbox = el("input");
  checkbox.type = "checkbox";
  checkbox.checked = state.completed;

  checkbox.addEventListener("change", async () => {
    state.completed = checkbox.checked;
    await saveCurrentInstance(instanceId);
  });

  const text = el("div", "task-text");
  text.textContent = task.text;
  if (state.completed) text.classList.add("completed");

  const note = el("div", "task-note");
  note.textContent = state.note;

  row.appendChild(checkbox);
  row.appendChild(text);

  if (state.note) {
    row.appendChild(note);
  }

  return row;
}

async function saveCurrentInstance(instanceId) {
  // Load current instance state from supabase and update
  const inst = await loadInstance(instanceId);
  await saveInstance(instanceId, inst);
}
