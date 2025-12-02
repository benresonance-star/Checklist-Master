// ------------------------------------------------------
// All Supabase database / auth requests live in this file
// ------------------------------------------------------

async function getCurrentUser() {
  const {
    data: { user }
  } = await window.supabase.auth.getUser();
  return user;
}

async function signIn(email, password) {
  return window.supabase.auth.signInWithPassword({ email, password });
}

async function signUp(email, password) {
  return window.supabase.auth.signUp({ email, password });
}

async function signOut() {
  return window.supabase.auth.signOut();
}

// Ensure profile row exists for this auth user
async function ensureProfile(user) {
  const { data: profile } = await window.supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // Add with default role: editor
    return window.supabase.from("profiles").insert({
      id: user.id,
      email: user.email,
      role: "editor",
    });
  }

  return profile;
}

// Load profile + role
async function loadProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  return ensureProfile(user);
}

// Load a checklist instance
async function loadInstance(instanceId) {
  const { data, error } = await window.supabase
    .from("instances")
    .select("state_json, updated_at")
    .eq("id", instanceId)
    .single();
  return data?.state_json;
}

// Save updated checklist instance
async function saveInstance(instanceId, instanceObj) {
  return window.supabase
    .from("instances")
    .update({
      state_json: instanceObj,
      updated_at: new Date().toISOString()
    })
    .eq("id", instanceId);
}
