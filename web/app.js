// web/app.js — ES module entry placeholder for the static skeleton.
// Co-exists with the Next.js app under web/app/ for non-bundled previews.

export function init(root) {
  if (!root) return;
  root.textContent = 'Life Quant Sim — skeleton ready.';
}

export default { init };
