// ui.js
export function createEl(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

// ---------- Toast ----------
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = createEl('output', `toast toast--${type}`, message);
  toast.setAttribute('role', 'status');
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  setTimeout(() => {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}

// ---------- Табы ----------
export function initTabs(root = document) {
  const tabs = Array.from(root.querySelectorAll('[role="tab"]'));
  const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));

  function activate(index) {
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      tab.classList.toggle('is-active', selected);
      panels[i].hidden = !selected;
    });
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => activate(i));
    tab.addEventListener('keydown', (e) => {
      let next = null;
      if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
      if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = tabs.length - 1;
      if (next != null) {
        e.preventDefault();
        activate(next);
        tabs[next].focus();
      }
    });
  });
}

// ---------- Focus trap ----------
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function openModal(modalEl) {
  modalEl.hidden = false;
  document.body.classList.add('no-scroll');
  const first = modalEl.querySelector(FOCUSABLE);
  if (first) first.focus();

  function trap(e) {
    if (e.key === 'Escape') { closeModal(modalEl); return; }
    if (e.key !== 'Tab') return;
    const items = Array.from(modalEl.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const firstEl = items[0];
    const lastEl = items[items.length - 1];
    if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
    else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
  }
  modalEl._trap = trap;
  document.addEventListener('keydown', trap);
}

export function closeModal(modalEl) {
  modalEl.hidden = true;
  document.body.classList.remove('no-scroll');
  if (modalEl._trap) document.removeEventListener('keydown', modalEl._trap);
}

// ---------- Валидация ----------
export function validateField(input) {
  const errorEl = input.closest('.form-field')?.querySelector('.field-error');
  let message = '';
  if (input.required && !input.value.trim()) message = 'Обязательное поле';
  else if (input.minLength > 0 && input.value.trim().length < input.minLength) message = `Минимум ${input.minLength} символа`;
  else if (input.type === 'number' && input.value !== '' && Number(input.value) < Number(input.min)) message = `Не меньше ${input.min}`;

  input.classList.toggle('is-invalid', Boolean(message));
  if (errorEl) errorEl.textContent = message;
  return !message;
}

export function initLiveValidation(form) {
  form.querySelectorAll('input').forEach((input) => {
    let timer;
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => validateField(input), 400);
    });
  });
}

// ---------- Skeleton ----------
export function createSkeleton(count = 6) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const card = createEl('article', 'skeleton-card');
    card.setAttribute('aria-hidden', 'true');
    card.append(createEl('span', 'skeleton-line skeleton-line--short'), createEl('span', 'skeleton-line'), createEl('span', 'skeleton-line'));
    frag.appendChild(card);
  }
  return frag;
}