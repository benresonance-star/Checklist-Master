// Small helpers living here

function qs(sel) {
  return document.querySelector(sel);
}

function qsa(sel) {
  return Array.from(document.querySelectorAll(sel));
}

function el(type, className, fill) {
  const e = document.createElement(type);
  if (className) e.className = className;
  if (fill) e.innerHTML = fill;
  return e;
}
