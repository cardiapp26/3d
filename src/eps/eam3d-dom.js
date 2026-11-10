/* Small DOM builders shared by the 3D EAM workstation panel and its cards. */

/** Create an element with a class, text and attributes. */
export function el(doc, tag, className, text, attrs = {}) {
  const node = doc.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

/** Add or remove one class (works on the className string, so test doubles need no classList). */
export function toggleClass(node, cls, enabled) {
  const parts = String(node.className || '').split(/\s+/).filter(Boolean);
  const has = parts.includes(cls);
  if (Boolean(enabled) === has) return;
  node.className = (enabled ? [...parts, cls] : parts.filter((p) => p !== cls)).join(' ');
}

/** A `type="button"` button. */
export function button(doc, className, attrs = {}, text = null) {
  const btn = el(doc, 'button', className, text, { type: 'button', ...attrs });
  btn.type = 'button';
  return btn;
}

/** A range or number input with its bounds set as both attributes and properties. */
export function numericInput(doc, type, { min, max, step, value }, attrs = {}) {
  const input = el(doc, 'input', '', null, { type, min, max, step, value, ...attrs });
  input.type = type;
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  return input;
}

/** A labelled checkbox; `onChange` receives the new boolean. */
export function checkbox(doc, attrs, checked, onChange) {
  const wrap = el(doc, 'label', 'eam3d-check');
  const input = el(doc, 'input', '', null, { type: 'checkbox', ...attrs });
  input.type = 'checkbox';
  input.checked = Boolean(checked);
  const label = el(doc, 'span');
  wrap.append(input, label);
  input.addEventListener('change', () => onChange(Boolean(input.checked)));
  return { wrap, input, label };
}

export function scrollToCard(node) {
  if (node && typeof node.scrollIntoView === 'function') node.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
