// app.js
import { properties, buildings, apartments } from './data.js';
import {
  createEl, createStatusBadge, renderPropertyCard, renderBuildingCard,
  renderApartmentRow, renderDetails, formatDate
} from './renderer.js';
import { initTabs, showToast, openModal, closeModal, initLiveValidation, validateField, createSkeleton } from './ui.js';

// ---------- Меню ----------
const btnMenu = document.getElementById('btn-menu');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');

function openMenu() {
  sidebar.classList.add('is-open');
  overlay.hidden = false;
  overlay.classList.add('is-visible');
  btnMenu.classList.add('is-active');
  btnMenu.setAttribute('aria-expanded', 'true');
  document.body.classList.add('no-scroll');
}
function closeMenu() {
  sidebar.classList.remove('is-open');
  overlay.classList.remove('is-visible');
  setTimeout(() => { if (!sidebar.classList.contains('is-open')) overlay.hidden = true; }, 250);
  btnMenu.classList.remove('is-active');
  btnMenu.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('no-scroll');
}
btnMenu?.addEventListener('click', () => sidebar.classList.contains('is-open') ? closeMenu() : openMenu());
overlay?.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && sidebar.classList.contains('is-open')) { closeMenu(); btnMenu.focus(); }
});
window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => { if (e.matches) closeMenu(); });

// ---------- Темы ----------
const THEME_KEY = 'theme';
const ACCENT_KEY = 'accent';
const THEMES = ['light', 'dark', 'solarized'];
const rootEl = document.documentElement;
const systemMedia = window.matchMedia('(prefers-color-scheme: dark)');

function hexToRgb(hex) {
  const clean = String(hex || '').replace('#', '').trim();
  if (clean.length === 3) return clean.split('').map((c) => parseInt(c + c, 16));
  if (clean.length !== 6 || /[^0-9a-f]/i.test(clean)) return null;
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}
function applyTheme(theme, { persist = true } = {}) {
  const next = THEMES.includes(theme) ? theme : 'light';
  rootEl.setAttribute('data-theme', next);
  if (persist) try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
  return next;
}
function applyAccent(hex, { persist = true } = {}) {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const normalized = '#' + String(hex).replace('#', '').trim();
  rootEl.style.setProperty('--accent', normalized);
  rootEl.style.setProperty('--accent-rgb', rgb.join(', '));
  if (persist) try { localStorage.setItem(ACCENT_KEY, normalized); } catch (e) {}
  return true;
}
function getSaved(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
function systemTheme() { return systemMedia.matches ? 'dark' : 'light'; }

function initTheme() {
  const select = document.getElementById('theme-select');
  const colorInput = document.getElementById('accent-color');
  const resetBtn = document.getElementById('btn-reset-theme');

  const initial = getSaved(THEME_KEY) || rootEl.getAttribute('data-theme') || systemTheme();
  applyTheme(initial, { persist: false });
  if (select) select.value = initial;

  const accent = getSaved(ACCENT_KEY);
  if (accent && colorInput) { applyAccent(accent, { persist: false }); colorInput.value = accent; }

  select?.addEventListener('change', (e) => applyTheme(e.target.value));
  colorInput?.addEventListener('input', (e) => applyAccent(e.target.value));
  resetBtn?.addEventListener('click', () => {
    try { localStorage.removeItem(THEME_KEY); localStorage.removeItem(ACCENT_KEY); } catch (e) {}
    const next = systemTheme();
    applyTheme(next, { persist: false });
    if (select) select.value = next;
    rootEl.style.removeProperty('--accent');
    rootEl.style.removeProperty('--accent-rgb');
    if (colorInput) colorInput.value = '#3b82f6';
    showToast('Оформление сброшено', 'info');
  });

  const onSystemChange = () => {
    if (!getSaved(THEME_KEY)) {
      const next = systemTheme();
      applyTheme(next, { persist: false });
      if (select) select.value = next;
    }
  };
  if (systemMedia.addEventListener) systemMedia.addEventListener('change', onSystemChange);
  else if (systemMedia.addListener) systemMedia.addListener(onSystemChange);
}
initTheme();

// ---------- Данные и рендер ----------
const propertiesContainer = document.getElementById('properties-container');
const buildingsContainer = document.getElementById('buildings-container');
const apartmentsBody = document.getElementById('apartments-table-body');
const emptyState = document.getElementById('properties-empty');

let apartmentsState = [...apartments];
let sortState = { key: 'id', dir: 'asc' };

function renderProperties(list) {
  propertiesContainer.replaceChildren(createSkeleton(3));
  setTimeout(() => {
    const frag = document.createDocumentFragment();
    list.forEach((p) => frag.appendChild(renderPropertyCard(p)));
    propertiesContainer.replaceChildren(frag);
    emptyState.hidden = list.length > 0;
  }, 300);
}

function renderBuildings(list) {
  const frag = document.createDocumentFragment();
  list.forEach((b) => frag.appendChild(renderBuildingCard(b)));
  buildingsContainer.replaceChildren(frag);
}

function renderApartments() {
  const sorted = [...apartmentsState].sort((a, b) => {
    const av = a[sortState.key], bv = b[sortState.key];
    const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
    return sortState.dir === 'asc' ? cmp : -cmp;
  });
  const frag = document.createDocumentFragment();
  sorted.forEach((apt) => frag.appendChild(renderApartmentRow(apt)));
  apartmentsBody.replaceChildren(frag);
}

// ---------- Фильтры ----------
const filtersForm = document.getElementById('filters-form');
function applyFilters() {
  const search = document.getElementById('search-properties').value.trim().toLowerCase();
  const priority = document.getElementById('filter-priority').value;
  const list = properties.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search);
    const matchPriority = priority === 'all' || p.priority === priority;
    return matchSearch && matchPriority;
  });
  renderProperties(list);
  if (list.length === 0) showToast('Ничего не найдено', 'warning');
}
filtersForm?.addEventListener('input', applyFilters);
filtersForm?.addEventListener('reset', () => setTimeout(applyFilters, 0));

// ---------- Сортировка (делегирование) ----------
document.querySelector('thead')?.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-sort]');
  if (!btn) return;
  const key = btn.dataset.sort;
  sortState = { key, dir: sortState.key === key && sortState.dir === 'asc' ? 'desc' : 'asc' };
  renderApartments();
  showToast(`Сортировка: ${key}`, 'info');
});

// ---------- Модалки ----------
const detailsModal = document.getElementById('details-modal');
const apartmentModal = document.getElementById('apartment-modal');
const modalBody = document.getElementById('modal-body-content');
const modalTitle = document.getElementById('modal-title');

propertiesContainer?.addEventListener('click', (e) => {
  const card = e.target.closest('.property-card');
  if (!card) return;
  const prop = properties.find((p) => p.id === card.dataset.id);
  if (!prop) return;
  modalTitle.textContent = prop.name;
  renderDetails(modalBody, prop);
  openModal(detailsModal);
});

apartmentsBody?.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-id]');
  if (!btn) return;
  const apt = apartments.find((a) => a.id === btn.dataset.id);
  if (!apt) return;
  modalTitle.textContent = `Квартира ${apt.id}`;
  modalBody.replaceChildren(
    createEl('p', null, `${apt.roomType}, ${apt.area} м², этаж ${apt.floor}`),
    createEl('p', null, `Цена: ${new Intl.NumberFormat('ru-RU').format(apt.price)} ₽`)
  );
  openModal(detailsModal);
});

document.querySelectorAll('.modal').forEach((modal) => {
  modal.addEventListener('click', (e) => {
    if (e.target.matches('[data-close], .modal-overlay')) closeModal(modal);
  });
  modal.querySelector('.modal-close')?.addEventListener('click', () => closeModal(modal));
});

// ---------- Форма квартиры ----------
const aptForm = document.getElementById('apartment-form');
initLiveValidation(aptForm);
document.getElementById('btn-add-apartment')?.addEventListener('click', () => {
  aptForm.reset();
  openModal(apartmentModal);
});
aptForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const inputs = Array.from(aptForm.querySelectorAll('input'));
  const valid = inputs.map(validateField).every(Boolean);
  if (!valid) { showToast('Проверьте поля формы', 'error'); return; }
  const data = new FormData(aptForm);
  apartmentsState.push({
    id: `apt-${String(apartmentsState.length + 1).padStart(3, '0')}`,
    buildingId: 'bld-001',
    roomType: data.get('roomType'),
    area: Number(data.get('area')),
    floor: Number(data.get('floor')),
    totalFloors: 25,
    price: Number(data.get('price')),
    saleStatus: 'available',
    lastUpdated: new Date().toISOString()
  });
  renderApartments();
  closeModal(apartmentModal);
  showToast('Квартира добавлена', 'success');
});

// ---------- Инициализация ----------
initTabs();
renderProperties(properties);
renderBuildings(buildings);
renderApartments();