// ------------------------------------------------------------
// utils.js
// Small DOM + state helpers shared by runner-ui.js & admin-ui.js
// ------------------------------------------------------------

// Shorthand query selector
function qs(selector, root) {
  return (root || document).querySelector(selector);
}

// Shorthand querySelectorAll, returns real Array
function qsa(selector, root) {
  return Array.from((root || document).querySelectorAll(selector));
}

// Create an element with optional className and textContent
//   el("div", "card header", "Hello")
//   el("button", null, "Click me")
function el(tagName, className, text) {
  const node = document.createElement(tagName || "div");

  if (className) {
    node.className = className;
  }

  if (text !== undefined && text !== null) {
    node.textContent = text;
  }

  return node;
}

// Generate a reasonably unique id for sections / subsections / tasks
// Example: makeId("sec") -> "sec_1740203490_ab12cd"
function makeId(prefix) {
  const p = prefix || "id";
  const rand = Math.random().toString(16).slice(2, 8);
  const ts = Date.now().toString(36);
  return `${p}_${ts}_${rand}`;
}

// ------------------------------------------------------------
// Textarea autosize helper
// ------------------------------------------------------------
// Usage:
//   autoresize(textarea)                 // default max 180px
//   autoresize(textarea, 220)            // custom max height
//
// This will:
//  - set height to "auto"
//  - grow to fit content up to `maxHeight`
//  - then fix height and enable vertical scroll
function autoresize(el, maxHeight) {
  if (!el) return;

  const limit = typeof maxHeight === "number" ? maxHeight : 180;

  // Reset first so scrollHeight is accurate
  el.style.height = "auto";

  const scroll = el.scrollHeight;
  const newHeight = Math.min(scroll, limit);

  el.style.height = newHeight + "px";
  el.style.overflowY = scroll > limit ? "auto" : "hidden";
}

// ------------------------------------------------------------
// Safe JSON parse helper (optional, but handy)
// ------------------------------------------------------------
function safeJSONParse(raw, fallback) {
  if (raw == null || raw === "") return fallback;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.warn("safeJSONParse failed:", e);
    return fallback;
  }
}
