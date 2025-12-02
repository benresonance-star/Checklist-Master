// -------------------------------------------------
// Merge logic: combine MasterChecklist + instance
// -------------------------------------------------

function mergeMasterWithInstance(master, instance) {
  const merged = JSON.parse(JSON.stringify(master));

  merged.taskState = instance?.taskState || {};

  // Ensure every master task has a state entry
  merged.sections.forEach(section => {
    section.subsections.forEach(sub => {
      sub.tasks.forEach(t => {
        if (!merged.taskState[t.id]) {
          merged.taskState[t.id] = {
            completed: false,
            note: ""
          };
        }
      });
    });
  });

  return merged;
}

