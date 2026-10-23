// renderer.js
export function createEl(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

const PRIORITY_LABELS = { high: 'Высокий', medium: 'Средний', low: 'Низкий' };
const STATUS_LABELS = { available: 'В продаже', reserved: 'Бронь', sold: 'Продана', blocked: 'Заблокирована' };

export function statusLabel(status) {
  return STATUS_LABELS[status] || status;
}

export function createStatusBadge(status) {
  return createEl('span', `status-badge status-${status}`, statusLabel(status));
}

export function createPriorityIndicator(priority) {
  const wrap = createEl('span', `priority priority--${priority}`);
  wrap.setAttribute('aria-label', `Приоритет: ${PRIORITY_LABELS[priority] || priority}`);
  wrap.textContent = PRIORITY_LABELS[priority] || priority;
  return wrap;
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('ru-RU');
}

export function renderPropertyCard(property) {
  const article = createEl('article', 'property-card');
  article.dataset.id = property.id;
  article.tabIndex = 0;
  article.setAttribute('role', 'button');
  article.setAttribute('aria-label', `Открыть детали: ${property.name}`);

  const header = createEl('header', 'property-card__header');
  header.append(
    createEl('span', 'property-card__id', property.id),
    createEl('h3', 'property-card__title', property.name),
    createPriorityIndicator(property.priority)
  );

  const body = createEl('section', 'property-card__body');
  body.append(createEl('p', 'property-card__desc', property.description));

  const meta = createEl('footer', 'property-card__meta');
  const time = createEl('time', null, formatDate(property.createdAt));
  time.dateTime = property.createdAt;
  meta.append(time, createEl('span', null, property.responsible));

  article.append(header, body, meta);
  return article;
}

export function renderBuildingCard(building) {
  const article = createEl('article', 'property-card');
  article.dataset.id = building.id;

  const header = createEl('header', 'property-card__header');
  header.append(
    createEl('span', 'property-card__id', building.id),
    createEl('h3', 'property-card__title', building.name)
  );

  const body = createEl('section', 'property-card__body');
  body.append(
    createEl('p', 'property-card__desc', building.description),
    createEl('span', 'status-badge status-available', building.constructionStage),
    createEl('span', null, `${building.floors} этажей`)
  );

  const meta = createEl('footer', 'property-card__meta');
  const time = createEl('time', null, formatDate(building.completionDate));
  time.dateTime = building.completionDate;
  meta.append(time);

  article.append(header, body, meta);
  return article;
}

export function renderApartmentRow(apt) {
  const tr = document.createElement('tr');

  const tdId = createEl('td', null, apt.id);
  tdId.dataset.label = 'ID';

  const tdType = createEl('td', null, `${apt.roomType}, ${apt.area} м²`);
  tdType.dataset.label = 'Тип / Площадь';

  const tdPrice = createEl('td', null, new Intl.NumberFormat('ru-RU').format(apt.price) + ' ₽');
  tdPrice.dataset.label = 'Цена';

  const tdStatus = createEl('td');
  tdStatus.dataset.label = 'Статус';
  tdStatus.appendChild(createStatusBadge(apt.saleStatus));

  const tdBuilding = createEl('td', null, apt.buildingId);
  tdBuilding.dataset.label = 'Корпус';

  const tdActions = createEl('td');
  tdActions.dataset.label = 'Действия';
  const btn = createEl('button', 'btn btn-secondary', 'Детали');
  btn.type = 'button';
  btn.dataset.id = apt.id;
  btn.setAttribute('aria-label', `Детали квартиры ${apt.id}`);
  tdActions.appendChild(btn);

  tr.append(tdId, tdType, tdPrice, tdStatus, tdBuilding, tdActions);
  return tr;
}

export function renderDetails(container, property) {
  const frag = document.createDocumentFragment();
  const dl = createEl('dl', 'details-list');
  const rows = [
    ['Локация', property.location],
    ['Застройщик', property.developer],
    ['Статус проекта', property.projectStatus],
    ['Ответственный', property.responsible],
    ['Теги', property.tags.join(', ')]
  ];
  rows.forEach(([label, value]) => {
    const dl_dt = createEl('dt', null, label);
    const dl_dd = createEl('dd', null, value);
    dl.append(dl_dt, dl_dd);
  });
  const time = createEl('time', null, formatDate(property.createdAt));
  time.dateTime = property.createdAt;
  const dt = createEl('dt', null, 'Создан');
  const dd = createEl('dd');
  dd.appendChild(time);
  dl.append(dt, dd);

  frag.append(createEl('p', 'details-desc', property.description), dl);
  container.replaceChildren(frag);
}