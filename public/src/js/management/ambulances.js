(() => {
  'use strict';

  // Visual mockup only. All changes stay in memory and reset when the page reloads.
  let ambulances = [
    { id: 1, plate: 'SAB001', model: 'Mercedes-Benz Sprinter', capacity: 4, status: 'OPERATIVA' },
    { id: 2, plate: 'SAB002', model: 'Renault Master', capacity: 4, status: 'OPERATIVA' },
    { id: 3, plate: 'SAB003', model: 'Fiat Ducato', capacity: 3, status: 'MANTENIMIENTO' },
    { id: 4, plate: 'SAB004', model: 'Ford Transit', capacity: 5, status: 'OPERATIVA' },
    { id: 5, plate: 'SAB005', model: 'Peugeot Boxer', capacity: 4, status: 'FUERA_SERVICIO' },
    { id: 6, plate: 'SAB006', model: 'Mercedes-Benz Sprinter', capacity: 4, status: 'OPERATIVA' },
    { id: 7, plate: 'SAB007', model: 'Renault Master', capacity: 3, status: 'MANTENIMIENTO' },
    { id: 8, plate: 'SAB008', model: 'Fiat Ducato', capacity: 4, status: 'OPERATIVA' }
  ];
  const $ = id => document.getElementById(id);
  const list = $('ambulance-list');
  const form = $('ambulance-form');
  if (!list || !form) return;
  const workspace = $('ambulance-workspace');
  const directory = $('directory-panel');
  const detailPanel = $('detail-panel');
  const dialog = $('ambulance-dialog');
  const deleteDialog = $('delete-dialog');
  const filters = [...document.querySelectorAll('[data-filter]')];
  const labels = { OPERATIVA: 'Operativa', MANTENIMIENTO: 'Mantenimiento', FUERA_SERVICIO: 'Fuera de servicio' };
  const statusClasses = { OPERATIVA: 'operational', MANTENIMIENTO: 'maintenance', FUERA_SERVICIO: 'unavailable' };
  const pageSize = 5;
  let activeFilter = 'ALL', currentPage = 1, selectedId = null, editingId = null, deletingId = null;
  let nextId = 9, toastTimer;

  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
  const plateKey = value => value.toUpperCase().replace(/[ -]/g, '');
  const icon = (file, className = '') => `<img src="../../../assets/Icons/${file}" alt="" aria-hidden="true"${className ? ` class="${className}"` : ''}>`;
  const pill = ambulance => `<span class="status-pill status-pill--${statusClasses[ambulance.status]}">${labels[ambulance.status]}</span>`;

  function matchingAmbulances() {
    const query = normalize($('ambulance-search').value);
    const compact = query.replace(/[ -]/g, '');
    return ambulances.filter(ambulance => (activeFilter === 'ALL' || ambulance.status === activeFilter) &&
      (!query || normalize(ambulance.model).includes(query) || normalize(plateKey(ambulance.plate)).includes(compact)));
  }

  function render() {
    const matches = matchingAmbulances();
    const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
    currentPage = Math.min(currentPage, pageCount);
    const start = (currentPage - 1) * pageSize;
    const shown = matches.slice(start, start + pageSize);
    list.innerHTML = shown.map(ambulance => `<article class="ambulance-row${selectedId === ambulance.id ? ' is-selected' : ''}">
      <div class="ambulance-identity"><span class="ambulance-avatar">${icon('ambulance-icon.png')}</span><span><strong>${escapeHtml(ambulance.plate)}</strong><small>Unidad #${String(ambulance.id).padStart(3, '0')}</small></span></div>
      <div class="ambulance-info">${icon('brand-icon.svg')}<span><b>${escapeHtml(ambulance.model)}</b><small>Modelo del vehículo</small></span></div>
      <div class="ambulance-info">${icon('seats-icon.svg')}<span><b>${ambulance.capacity} plazas</b><small>Capacidad total</small></span></div>
      ${pill(ambulance)}
      <button type="button" class="row-action" data-select-id="${ambulance.id}" aria-label="Ver detalle de ${escapeHtml(ambulance.plate)}" aria-controls="detail-panel" aria-expanded="${selectedId === ambulance.id}">${icon('arrow-left.svg', 'chevron-icon')}</button>
    </article>`).join('');
    $('ambulance-empty').hidden = matches.length > 0;
    $('empty-description').textContent = ambulances.length ? 'No se encontraron ambulancias con estos criterios.' : 'No hay ambulancias registradas. Agrega una para comenzar.';
    $('clear-filters').hidden = ambulances.length === 0;
    $('results-summary').textContent = matches.length ? `Mostrando ${start + 1} a ${start + shown.length} de ${matches.length} ${matches.length === 1 ? 'ambulancia' : 'ambulancias'}` : 'Mostrando 0 ambulancias';
    let pages = '';
    for (let page = 1; page <= pageCount; page++) {
      pages += `<button type="button" data-page="${page}" class="${page === currentPage ? 'is-active' : ''}" aria-label="Página ${page}"${page === currentPage ? ' aria-current="page"' : ''}>${page}</button>`;
    }
    $('ambulance-pagination').innerHTML = `<button type="button" data-page="${currentPage - 1}" aria-label="Página anterior"${currentPage === 1 ? ' disabled' : ''}>‹</button>${pages}<button type="button" data-page="${currentPage + 1}" aria-label="Página siguiente"${currentPage === pageCount ? ' disabled' : ''}>›</button>`;
    filters.forEach(button => {
      const selected = button.dataset.filter === activeFilter;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    $('metric-total').textContent = String(ambulances.length);
    [['operational', 'OPERATIVA'], ['maintenance', 'MANTENIMIENTO'], ['unavailable', 'FUERA_SERVICIO']].forEach(([id, status]) => {
      $(`metric-${id}`).textContent = String(ambulances.filter(ambulance => ambulance.status === status).length);
    });
  }

  function closeDetail(restoreFocus = false) {
    const previousId = selectedId;
    selectedId = null;
    workspace.classList.remove('has-selection');
    detailPanel.inert = true;
    detailPanel.setAttribute('aria-hidden', 'true');
    directory.inert = false;
    render();
    if (restoreFocus) (list.querySelector(`[data-select-id="${previousId}"]`) || $('new-ambulance')).focus();
  }

  function selectAmbulance(id) {
    const ambulance = ambulances.find(item => item.id === id);
    if (!ambulance) return;
    selectedId = id;
    $('detail-content').innerHTML = `<div class="detail-hero"><span class="ambulance-avatar">${icon('ambulance-icon.png')}</span><div class="detail-hero-text"><strong>${escapeHtml(ambulance.plate)}</strong><p>${escapeHtml(ambulance.model)}</p><p>Unidad #${String(ambulance.id).padStart(3, '0')}</p></div>${pill(ambulance)}</div>
      <div class="detail-grid"><section class="detail-card"><h3>Información general</h3><dl>
        <dt>${icon('id-badge.svg')}Matrícula</dt><dd>${escapeHtml(ambulance.plate)}</dd>
        <dt>${icon('brand-icon.svg')}Modelo</dt><dd>${escapeHtml(ambulance.model)}</dd>
        <dt>${icon('seats-icon.svg')}Capacidad</dt><dd>${ambulance.capacity} plazas</dd>
        <dt>${icon('information-icon.svg')}Estado operativo</dt><dd>${labels[ambulance.status]}</dd>
      </dl></section></div>`;
    detailPanel.inert = false;
    detailPanel.setAttribute('aria-hidden', 'false');
    workspace.classList.add('has-selection');
    render();
    $('close-detail').focus();
    directory.inert = true;
  }

  function clearError() {
    $('form-error').hidden = true;
    [...form.elements].forEach(element => element.setCustomValidity?.(''));
  }

  function openForm(ambulance = null) {
    closeDetail();
    form.reset(); clearError();
    editingId = ambulance?.id ?? null;
    $('ambulance-form-title').textContent = ambulance ? 'Editar ambulancia' : 'Nueva ambulancia';
    $('form-subtitle').textContent = ambulance ? `Actualiza los datos de la unidad ${ambulance.plate}.` : 'Completa los datos del vehículo.';
    $('save-label').textContent = ambulance ? 'Guardar cambios' : 'Guardar ambulancia';
    if (ambulance) {
      form.elements.matricula.value = ambulance.plate;
      form.elements.modelo.value = ambulance.model;
      form.elements.capacidad.value = ambulance.capacity;
      form.elements.estado_operativo.value = ambulance.status;
    }
    dialog.showModal();
    $('ambulance-plate').focus();
  }

  function toast(message) {
    clearTimeout(toastTimer);
    $('ambulance-toast').textContent = message;
    $('ambulance-toast').hidden = false;
    toastTimer = setTimeout(() => { $('ambulance-toast').hidden = true; }, 4000);
  }

  form.addEventListener('input', clearError);
  form.addEventListener('change', clearError);
  form.addEventListener('submit', event => {
    event.preventDefault(); clearError();
    const ambulance = {
      id: editingId ?? nextId,
      plate: plateKey(form.elements.matricula.value.trim()),
      model: form.elements.modelo.value.trim(),
      capacity: Number(form.elements.capacidad.value),
      status: form.elements.estado_operativo.value
    };
    if (!ambulance.model) form.elements.modelo.setCustomValidity('Ingresa el modelo del vehículo.');
    if (!/^[A-Z0-9]+$/.test(ambulance.plate)) form.elements.matricula.setCustomValidity('Ingresa una matrícula válida.');
    if (!Number.isInteger(ambulance.capacity) || ambulance.capacity < 1 || ambulance.capacity > 99) form.elements.capacidad.setCustomValidity('Ingresa una capacidad de 1 a 99 plazas.');
    if (ambulances.some(item => item.id !== editingId && plateKey(item.plate) === ambulance.plate)) {
      form.elements.matricula.setCustomValidity('Ya existe una ambulancia con esa matrícula.');
      $('form-error').textContent = 'Ya existe una ambulancia con esa matrícula.';
      $('form-error').hidden = false;
    }
    if (!form.reportValidity()) return;
    const wasEditing = editingId !== null;
    if (wasEditing) ambulances = ambulances.map(item => item.id === editingId ? ambulance : item);
    else { ambulances.unshift(ambulance); nextId++; }
    activeFilter = 'ALL'; $('ambulance-search').value = '';
    currentPage = Math.floor(ambulances.findIndex(item => item.id === ambulance.id) / pageSize) + 1;
    dialog.close(); render();
    toast(wasEditing ? `Ambulancia ${ambulance.plate} actualizada.` : `Ambulancia ${ambulance.plate} agregada.`);
  });

  $('new-ambulance').addEventListener('click', () => openForm());
  $('close-ambulance-dialog').addEventListener('click', () => dialog.close());
  $('cancel-ambulance').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { editingId = null; $('new-ambulance').focus(); });
  $('edit-from-detail').addEventListener('click', () => openForm(ambulances.find(item => item.id === selectedId)));
  $('delete-from-detail').addEventListener('click', () => {
    const ambulance = ambulances.find(item => item.id === selectedId);
    if (!ambulance) return;
    deletingId = ambulance.id;
    $('delete-description').textContent = `Se eliminará la unidad ${ambulance.plate} (${ambulance.model}) del listado. ¿Deseas continuar?`;
    deleteDialog.showModal();
  });
  document.querySelectorAll('[data-close-delete]').forEach(button => button.addEventListener('click', () => deleteDialog.close()));
  deleteDialog.addEventListener('close', () => { deletingId = null; });
  $('confirm-delete').addEventListener('click', () => {
    const ambulance = ambulances.find(item => item.id === deletingId);
    if (!ambulance) return;
    ambulances = ambulances.filter(item => item.id !== deletingId);
    closeDetail(); deleteDialog.close(); render(); $('new-ambulance').focus();
    toast(`Ambulancia ${ambulance.plate} eliminada.`);
  });
  list.addEventListener('click', event => {
    const button = event.target.closest('[data-select-id]');
    if (button) selectAmbulance(Number(button.dataset.selectId));
  });
  $('close-detail').addEventListener('click', () => closeDetail(true));
  workspace.addEventListener('click', event => { if (event.target === workspace && selectedId !== null) closeDetail(true); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && selectedId !== null && !dialog.open && !deleteDialog.open) closeDetail(true);
  });
  $('ambulance-search').addEventListener('input', () => { currentPage = 1; render(); });
  filters.forEach(button => button.addEventListener('click', () => { activeFilter = button.dataset.filter; currentPage = 1; render(); }));
  $('clear-filters').addEventListener('click', () => { activeFilter = 'ALL'; currentPage = 1; $('ambulance-search').value = ''; render(); });
  $('ambulance-pagination').addEventListener('click', event => {
    const button = event.target.closest('[data-page]');
    if (button && !button.disabled) { currentPage = Number(button.dataset.page); render(); }
  });
  render();
})();
