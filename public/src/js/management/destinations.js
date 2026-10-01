document.addEventListener('DOMContentLoaded', () => {
  // Local mock data only. This collection can later be used by the transfer form.
  const storageKey = 'hospital-destinations-v1';
  const pageSize = 6;
  const iconBase = '../../../assets/Icons/';
  const destinationTypes = ['Hospital', 'Sanatorio', 'Centro de salud', 'Otro'];
  const statuses = ['Activo', 'Inactivo'];
  const initialDestinations = [
    { id: 'seed-1', name: 'Hospital de Clínicas', address: 'Av. Italia 2870', locality: 'Montevideo', type: 'Hospital', phone: '', notes: 'Ingreso de ambulancias por emergencia.', status: 'Activo' },
    { id: 'seed-2', name: 'Hospital Maciel', address: '25 de Mayo 174', locality: 'Montevideo', type: 'Hospital', phone: '', notes: 'Coordinar el acceso con el personal de recepción.', status: 'Activo' },
    { id: 'seed-3', name: 'Hospital Pasteur', address: 'Larravide 2458', locality: 'Montevideo', type: 'Hospital', phone: '', notes: '', status: 'Activo' },
    { id: 'seed-4', name: 'Sanatorio Central', address: 'Av. 18 de Julio 1820', locality: 'Montevideo', type: 'Sanatorio', phone: '', notes: 'Acceso lateral para traslados programados.', status: 'Activo' },
    { id: 'seed-5', name: 'Centro de Rehabilitación', address: 'Camino Maldonado 5680', locality: 'Montevideo', type: 'Centro de salud', phone: '', notes: 'Destino temporalmente fuera de servicio.', status: 'Inactivo' },
    { id: 'seed-6', name: 'Policlínica Las Piedras', address: 'Av. Artigas 560', locality: 'Las Piedras', type: 'Centro de salud', phone: '', notes: '', status: 'Activo' },
    { id: 'seed-7', name: 'Centro de Diagnóstico', address: 'Bv. Artigas 1450', locality: 'Montevideo', type: 'Centro de salud', phone: '', notes: 'Confirmar el horario del estudio antes del traslado.', status: 'Activo' },
    { id: 'seed-8', name: 'Laboratorio Central', address: 'Av. Italia 2890', locality: 'Montevideo', type: 'Otro', phone: '', notes: 'Recepción de muestras por la entrada principal.', status: 'Inactivo' }
  ];

  const rows = document.getElementById('destinations-rows');
  const search = document.getElementById('destinations-search');
  const form = document.getElementById('destinations-form');
  const nameInput = document.getElementById('destination-name');
  const addressInput = document.getElementById('destination-address');
  const localityInput = document.getElementById('destination-locality');
  const typeInput = document.getElementById('destination-type');
  const phoneInput = document.getElementById('destination-phone');
  const notesInput = document.getElementById('destination-notes');
  const statusInput = document.getElementById('destination-status');
  const feedback = document.getElementById('form-feedback');
  const detailDialog = document.getElementById('destination-dialog');
  const deleteDialog = document.getElementById('delete-dialog');
  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  if (!rows || !search || !form || !detailDialog || !deleteDialog) return;

  let destinations = loadDestinations();
  let activeFilter = 'Activo';
  let currentPage = 1;
  let editingId = null;
  let detailId = null;
  let deletingId = null;

  function loadDestinations() {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        const ids = new Set();
        if (Array.isArray(parsed) && parsed.every(destination => {
          if (!destination || typeof destination.id !== 'string' || !destination.id || ids.has(destination.id)) return false;
          ids.add(destination.id);
          return ['name', 'address', 'locality'].every(key =>
            typeof destination[key] === 'string' && destination[key].trim().length > 0
          ) && typeof destination.phone === 'string' && typeof destination.notes === 'string' &&
            destinationTypes.includes(destination.type) && statuses.includes(destination.status);
        })) return parsed;
      }
    } catch (_) {
      // CRUD remains available in memory if browser storage is unavailable.
    }
    return initialDestinations.map(destination => ({ ...destination }));
  }

  function saveDestinations() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(destinations));
      return true;
    } catch (_) {
      return false;
    }
  }

  function normalize(value) {
    return value.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ').trim();
  }

  function getMatchingDestinations() {
    const words = normalize(search.value).split(' ').filter(Boolean);
    return destinations.filter(destination => {
      const content = normalize(`${destination.name} ${destination.address} ${destination.locality} ${destination.type} ${destination.phone}`);
      return destination.status === activeFilter &&
        words.every(word => content.includes(word));
    });
  }

  function makeIcon(file) {
    const icon = document.createElement('img');
    icon.src = iconBase + file;
    icon.alt = '';
    icon.setAttribute('aria-hidden', 'true');
    return icon;
  }

  function makeCell(text) {
    const cell = document.createElement('td');
    cell.textContent = text;
    cell.title = text;
    return cell;
  }

  function makeAction(action, label, icon, destination) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'row-action';
    button.dataset.action = action;
    button.dataset.id = destination.id;
    button.setAttribute('aria-label', `${label} ${destination.name}`);
    button.title = `${label} ${destination.name}`;
    button.append(makeIcon(icon));
    return button;
  }

  function makeRow(destination) {
    const row = document.createElement('tr');
    row.classList.toggle('is-editing', destination.id === editingId);
    const nameCell = document.createElement('td');
    const nameContent = document.createElement('span');
    nameContent.className = 'destination-name-cell';
    const avatar = document.createElement('span');
    avatar.className = 'destination-avatar';
    avatar.append(makeIcon('location-icon.svg'));
    const copy = document.createElement('span');
    copy.className = 'destination-copy';
    const name = document.createElement('strong');
    name.textContent = destination.name;
    name.title = destination.name;
    const type = document.createElement('small');
    type.textContent = destination.type;
    copy.append(name, type);
    nameContent.append(avatar, copy);
    nameCell.append(nameContent);

    const statusCell = document.createElement('td');
    const status = document.createElement('span');
    status.className = 'status-text';
    const dot = document.createElement('span');
    dot.className = 'status-dot' + (destination.status === 'Inactivo' ? ' is-inactive' : '');
    dot.setAttribute('aria-hidden', 'true');
    status.append(dot, document.createTextNode(destination.status));
    statusCell.append(status);

    const actionsCell = document.createElement('td');
    const actions = document.createElement('div');
    actions.className = 'row-actions';
    actions.append(
      makeAction('view', 'Ver', 'eye.svg', destination),
      makeAction('edit', 'Editar', 'pencil-icon.svg', destination),
      makeAction('delete', 'Eliminar', 'trash-icon.svg', destination)
    );
    actionsCell.append(actions);
    row.append(nameCell, makeCell(destination.address), makeCell(destination.locality), statusCell, actionsCell);
    return row;
  }

  function render() {
    const matching = getMatchingDestinations();
    const pageCount = Math.max(1, Math.ceil(matching.length / pageSize));
    currentPage = Math.max(1, Math.min(currentPage, pageCount));
    const start = (currentPage - 1) * pageSize;
    const visible = matching.slice(start, start + pageSize);
    rows.replaceChildren(...visible.map(makeRow));

    const statusCount = destinations.filter(destination => destination.status === activeFilter).length;
    document.getElementById('list-title').textContent = `Destinos ${activeFilter === 'Activo' ? 'activos' : 'inactivos'}`;
    document.getElementById('list-count').textContent =
      `Total de ${statusCount} ${statusCount === 1 ? 'destino registrado' : 'destinos registrados'}.`;
    document.getElementById('results-summary').textContent = matching.length
      ? `Mostrando ${start + 1} a ${start + visible.length} de ${matching.length} resultados`
      : 'Mostrando 0 resultados';
    document.getElementById('page-number').textContent = String(currentPage);
    document.getElementById('page-prev').disabled = currentPage === 1;
    document.getElementById('page-next').disabled = currentPage === pageCount;

    const noRecords = destinations.length === 0;
    document.getElementById('empty-state').hidden = matching.length > 0;
    document.getElementById('empty-title').textContent = noRecords ? 'Aún no hay destinos' : 'No se encontraron destinos';
    document.getElementById('empty-description').textContent = noRecords
      ? 'Agrega el primer destino desde el formulario.' : 'Prueba con otro nombre, dirección, localidad o estado.';
    document.getElementById('empty-action').textContent = noRecords ? 'Agregar destino' : 'Limpiar búsqueda';
  }

  function showFeedback(message, tone = '') {
    feedback.textContent = message;
    feedback.className = 'form-feedback' + (tone ? ` is-${tone}` : '');
  }

  function updateStatus() {
    const inactive = statusInput.value === 'Inactivo';
    document.getElementById('form-status-dot').classList.toggle('is-inactive', inactive);
  }

  function clearForm() {
    form.reset();
    editingId = null;
    document.getElementById('form-title').textContent = 'Agregar destino';
    document.getElementById('form-subtitle').textContent = 'Completa la información del destino.';
    document.getElementById('save-label').textContent = 'Guardar';
    [nameInput, addressInput, localityInput, phoneInput].forEach(input => input.setCustomValidity(''));
    showFeedback('');
    updateStatus();
  }

  function setFilter(filter) {
    activeFilter = filter;
    currentPage = 1;
    filterButtons.forEach(button => {
      const selected = button.dataset.filter === filter;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    render();
  }

  function editDestination(destination) {
    clearForm();
    editingId = destination.id;
    document.getElementById('form-title').textContent = 'Editar destino';
    document.getElementById('form-subtitle').textContent = 'Actualiza la información del destino.';
    document.getElementById('save-label').textContent = 'Actualizar';
    nameInput.value = destination.name;
    addressInput.value = destination.address;
    localityInput.value = destination.locality;
    typeInput.value = destination.type;
    phoneInput.value = destination.phone;
    notesInput.value = destination.notes;
    statusInput.value = destination.status;
    updateStatus();
    render();
    nameInput.focus();
  }

  function showDestination(destination) {
    detailId = destination.id;
    const details = document.getElementById('dialog-details');
    details.replaceChildren();
    [
      ['Nombre', destination.name], ['Tipo', destination.type], ['Dirección', destination.address],
      ['Localidad', destination.locality], ['Teléfono', destination.phone || 'Sin teléfono registrado'],
      ['Estado', destination.status], ['Acceso', destination.notes || 'Sin referencia de acceso']
    ].forEach(([label, value]) => {
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.textContent = label;
      description.textContent = value;
      details.append(term, description);
    });
    detailDialog.showModal();
  }

  function confirmDeletion(destination) {
    deletingId = destination.id;
    document.getElementById('delete-description').textContent =
      `¿Eliminar “${destination.name}”? Se quitará del listado de destinos predefinidos. Esta acción no se puede deshacer.`;
    deleteDialog.showModal();
  }

  filterButtons.forEach(button => button.addEventListener('click', () => setFilter(button.dataset.filter)));
  search.addEventListener('input', () => { currentPage = 1; render(); });
  document.getElementById('page-prev').addEventListener('click', () => { currentPage -= 1; render(); });
  document.getElementById('page-next').addEventListener('click', () => { currentPage += 1; render(); });
  document.getElementById('form-cancel').addEventListener('click', () => { clearForm(); render(); });
  statusInput.addEventListener('change', updateStatus);
  [nameInput, addressInput, localityInput, phoneInput].forEach(input => {
    input.addEventListener('input', () => { input.setCustomValidity(''); showFeedback(''); });
  });
  document.getElementById('empty-action').addEventListener('click', () => {
    search.value = '';
    currentPage = 1;
    render();
    if (destinations.length === 0) { clearForm(); nameInput.focus(); }
    else search.focus();
  });

  rows.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const destination = destinations.find(item => item.id === button.dataset.id);
    if (!destination) return;
    if (button.dataset.action === 'view') showDestination(destination);
    if (button.dataset.action === 'edit') editDestination(destination);
    if (button.dataset.action === 'delete') confirmDeletion(destination);
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    const requiredInputs = [
      [nameInput, 'Ingresa el nombre del destino.'],
      [addressInput, 'Ingresa la dirección del destino.'],
      [localityInput, 'Ingresa la localidad del destino.']
    ];
    for (const [input, message] of requiredInputs) {
      if (!input.value.trim()) {
        input.setCustomValidity(message);
        input.reportValidity();
        showFeedback(message, 'error');
        return;
      }
    }
    const phone = phoneInput.value.trim();
    if (phone && (!/^\+?[\d\s().-]+$/.test(phone) || phone.replace(/\D/g, '').length < 8 || phone.replace(/\D/g, '').length > 15)) {
      phoneInput.setCustomValidity('Ingresa un teléfono de 8 a 15 dígitos o deja el campo vacío.');
      phoneInput.reportValidity();
      showFeedback('Revisa el teléfono de contacto.', 'error');
      return;
    }
    const record = {
      id: editingId || `destination-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: nameInput.value.trim(),
      address: addressInput.value.trim(),
      locality: localityInput.value.trim(),
      type: typeInput.value,
      phone,
      notes: notesInput.value.trim(),
      status: statusInput.value
    };
    const duplicate = destinations.some(destination => destination.id !== editingId &&
      ['name', 'address', 'locality'].every(key => normalize(destination[key]) === normalize(record[key])));
    if (duplicate) {
      showFeedback('Ya existe un destino con ese nombre, dirección y localidad.', 'error');
      nameInput.focus();
      return;
    }
    const wasEditing = editingId !== null;
    if (wasEditing) {
      const index = destinations.findIndex(destination => destination.id === editingId);
      if (index === -1) return;
      destinations[index] = record;
    } else {
      destinations.push(record);
    }
    const saved = saveDestinations();
    clearForm();
    search.value = '';
    if (activeFilter !== record.status) setFilter(record.status);
    const recordIndex = getMatchingDestinations().findIndex(destination => destination.id === record.id);
    currentPage = Math.floor(recordIndex / pageSize) + 1;
    render();
    showFeedback(
      `${wasEditing ? 'Destino actualizado.' : 'Destino guardado.'}${saved ? '' : ' Los cambios se conservarán solo en esta sesión.'}`,
      saved ? '' : 'warning'
    );
  });

  document.getElementById('detail-close').addEventListener('click', () => detailDialog.close());
  document.getElementById('detail-edit').addEventListener('click', () => {
    const destination = destinations.find(item => item.id === detailId);
    detailDialog.close();
    if (destination) editDestination(destination);
  });
  ['delete-close', 'delete-cancel'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => deleteDialog.close());
  });
  document.getElementById('delete-confirm').addEventListener('click', () => {
    const destination = destinations.find(item => item.id === deletingId);
    if (!destination) { deleteDialog.close(); return; }
    destinations = destinations.filter(item => item.id !== destination.id);
    if (editingId === destination.id) clearForm();
    const saved = saveDestinations();
    deleteDialog.close();
    render();
    showFeedback(
      `Destino eliminado.${saved ? '' : ' Los cambios se conservarán solo en esta sesión.'}`,
      saved ? '' : 'warning'
    );
  });
  deleteDialog.addEventListener('close', () => { deletingId = null; });
  [detailDialog, deleteDialog].forEach(dialog => {
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
  });

  updateStatus();
  render();
});
