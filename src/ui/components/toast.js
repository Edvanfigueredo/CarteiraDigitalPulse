let stack;
function ensureStack() {
  if (stack) return stack;
  stack = document.createElement('div');
  stack.className = 'toast-stack';
  stack.setAttribute('role', 'status');
  stack.setAttribute('aria-live', 'polite');
  document.body.appendChild(stack);
  return stack;
}

export function showToast(message, type = 'default', duration = 3500) {
  const el = document.createElement('div');
  el.className = `toast${type === 'error' ? ' toast-error' : ''}${type === 'success' ? ' toast-success' : ''}`;
  el.textContent = message;
  ensureStack().appendChild(el);
  setTimeout(() => el.remove(), duration);
}
