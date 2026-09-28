document.addEventListener('DOMContentLoaded', () => {
  const storageKey = 'hospital-personnel-v1';
  const pageSize = 6;
  const iconBase = '../../../assets/Icons/';
  const initialPeople = [
    { id: 'seed-1', name: 'Carlos Fernández', role: 'Chofer', phone: '099 123 456', document: '', license: 'A1234567', status: 'Activo' },
    { id: 'seed-2', name: 'Miguel Torres', role: 'Chofer', phone: '098 765 432', document: '', license: 'B7654321', status: 'Activo' },
    { id: 'seed-3', name: 'José Ramírez', role: 'Chofer', phone: '099 234 567', document: '', license: 'C9876543', status: 'Activo' },
    { id: 'seed-4', name: 'Fernando López', role: 'Chofer', phone: '098 345 678', document: '', license: 'D4567890', status: 'Inactivo' },
    { id: 'seed-5', name: 'Ricardo Sosa', role: 'Chofer', phone: '099 876 543', document: '', license: 'E3210987', status: 'Activo' },
    { id: 'seed-6', name: 'Daniel Giménez', role: 'Chofer', phone: '098 111 222', document: '', license: 'F6543210', status: 'Activo' }
  ];

  const rows = document.getElementById('personnel-rows');
  const search = document.getElementById('personnel-search');
  const form = document.getElementById('personnel-form');
  const nameInput = document.getElementById('person-name');
  const roleInput = document.getElementById('person-role');
  const phoneInput = document.getElementById('person-phone');
  const documentInput = document.getElementById('person-document');
  const licenseInput = document.getElementById('person-license');
  const statusInput = document.getElementById('person-status');
  const formTitle = document.getElementById('form-title');
  const formSubtitle = document.getElementById('form-subtitle');
  const feedback = document.getElementById('form-feedback');
  const dialog = document.getElementById('person-dialog');
  if (!rows || !search || !form || !dialog) return;

  let people = loadPeople();
  let activeRole = 'Chofer';
  let currentPage = 1;
  let editingId = null;

  function loadPeople() {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === null) return initialPeople.map(person => ({ ...person }));
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.every(person =>
        person && typeof person.id === 'string' && typeof person.name === 'string' &&
        (person.role === 'Chofer' || person.role === 'Copiloto') &&
        typeof person.phone === 'string' && typeof person.document === 'string' &&
        typeof person.license === 'string' &&
        (person.status === 'Activo' || person.status === 'Inactivo')
      )) return parsed;
    } catch (_) {
      // The page still works when storage is unavailable.
    }
    return initialPeople.map(person => ({ ...person }));
  }

  function savePeople() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(people));
      return true;
    } catch (_) {
      return false;
    }
  }

  function normalize(value) {
    return value.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  function matchesSearch(person, query) {
    if (!query) return true;
    const content = normalize(`${person.name} ${person.document} ${person.phone} ${person.license}`);
    if (content.includes(query)) return true;
    const compactQuery = query.replace(/[^a-z0-9]/g, '');
    return compactQuery.length > 0 && content.replace(/[^a-z0-9]/g, '').includes(compactQuery);
  }

  function makeIcon(file) {
    const image = document.createElement('img');
    image.src = iconBase + file;
    image.alt = '';
    image.setAttribute('aria-hidden', 'true');
    return image;
  }

  function makeCell(text) {
    const cell = document.createElement('td');
    cell.textContent = text;
    return cell;
  }

  function makeAction(action, label, icon, person) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'row-action';
    button.dataset.action = action;
    button.dataset.id = person.id;
    button.setAttribute('aria-label', `${label} ${person.name}`);
    button.title = `${label} ${person.name}`;
    button.append(makeIcon(icon));
    return button;
  }

  function makeRow(person) {
    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    const nameContent = document.createElement('span');
    nameContent.className = 'person-name-cell';
    const avatar = document.createElement('span');
    avatar.className = 'person-avatar';
    avatar.append(makeIcon(person.role === 'Chofer' ? 'steering-wheel.svg' : 'person-icon.svg'));
    const name = document.createElement('span');
    name.textContent = person.name;
    nameContent.append(avatar, name);
    nameCell.append(nameContent);

    const statusCell = document.createElement('td');
    const status = document.createElement('span');
    status.className = 'status-text';
    const dot = document.createElement('span');
    dot.className = 'status-dot' + (person.status === 'Inactivo' ? ' is-inactive' : '');
    dot.setAttribute('aria-hidden', 'true');
    const statusLabel = document.createElement('span');
    statusLabel.textContent = person.status;
    status.append(dot, statusLabel);
    statusCell.append(status);

    const actionsCell = document.createElement('td');
    const actions = document.createElement('div');
    actions.className = 'row-actions';
    actions.append(
      makeAction('view', 'Ver', 'eye.svg', person),
      makeAction('edit', 'Editar', 'pencil-icon.svg', person),
      makeAction('delete', 'Eliminar', 'trash-icon.svg', person)
    );
    actionsCell.append(actions);

    row.append(nameCell, makeCell(person.role), makeCell(person.phone),
      makeCell(person.license || person.document || '—'), statusCell, actionsCell);
    return row;
  }

  function render() {
    const rolePeople = people.filter(person => person.role === activeRole);
    const query = normalize(search.value);
    const matching = rolePeople.filter(person => matchesSearch(person, query));
    const pageCount = Math.max(1, Math.ceil(matching.length / pageSize));
    currentPage = Math.min(currentPage, pageCount);
    const start = (currentPage - 1) * pageSize;
    const visible = matching.slice(start, start + pageSize);
    const fragment = document.createDocumentFragment();
    visible.forEach(person => fragment.append(makeRow(person)));
    rows.replaceChildren(fragment);

    const plural = activeRole === 'Chofer' ? 'choferes' : 'copilotos';
    document.getElementById('list-title').textContent = `Listado de ${plural}`;
    document.getElementById('list-count').textContent = `Total de ${rolePeople.length} ${plural} registrados.`;
    document.getElementById('personnel-list').setAttribute('aria-labelledby', activeRole === 'Chofer' ? 'tab-chofer' : 'tab-copiloto');
    document.getElementById('results-summary').textContent = matching.length
      ? `Mostrando ${start + 1} a ${start + visible.length} de ${matching.length} resultados`
      : 'Mostrando 0 resultados';
    document.getElementById('empty-state').hidden = matching.length > 0;
    document.getElementById('page-number').textContent = String(currentPage);
    document.getElementById('page-prev').disabled = currentPage === 1;
    document.getElementById('page-next').disabled = currentPage === pageCount;
  }

  function updateRoleIcon() {
    document.getElementById('role-icon').src = iconBase +
      (roleInput.value === 'Chofer' ? 'steering-wheel.svg' : 'person-icon.svg');
    licenseInput.required = roleInput.value === 'Chofer';
  }

  function updateStatusDot() {
    document.getElementById('form-status-dot').classList.toggle('is-inactive', statusInput.value === 'Inactivo');
  }

  function clearForm() {
    form.reset();
    editingId = null;
    formTitle.textContent = 'Agregar personal';
    formSubtitle.textContent = 'Completa la información del personal.';
    roleInput.value = activeRole;
    documentInput.required = true;
    feedback.textContent = '';
    nameInput.setCustomValidity('');
    phoneInput.setCustomValidity('');
    updateRoleIcon();
    updateStatusDot();
  }

  function switchRole(role) {
    activeRole = role;
    currentPage = 1;
    document.querySelectorAll('.role-tab').forEach(tab => {
      const selected = tab.dataset.role === role;
      tab.classList.toggle('is-active', selected);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    clearForm();
    render();
  }

  function showPerson(person) {
    const details = document.getElementById('dialog-details');
    details.replaceChildren();
    [
      ['Nombre', person.name], ['Rol', person.role], ['Teléfono', person.phone],
      ['Documento', person.document || '—'], ['Licencia', person.license || '—'], ['Estado', person.status]
    ].forEach(([label, value]) => {
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.textContent = label;
      description.textContent = value;
      details.append(term, description);
    });
    dialog.showModal();
  }

  function editPerson(person) {
    if (person.role !== activeRole) switchRole(person.role);
    editingId = person.id;
    formTitle.textContent = 'Editar personal';
    formSubtitle.textContent = 'Actualiza la información del personal.';
    nameInput.value = person.name;
    roleInput.value = person.role;
    phoneInput.value = person.phone;
    documentInput.value = person.document;
    documentInput.required = Boolean(person.document);
    licenseInput.value = person.license;
    statusInput.value = person.status;
    feedback.textContent = '';
    updateRoleIcon();
    updateStatusDot();
    nameInput.focus();
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  document.querySelectorAll('.role-tab').forEach(tab => {
    tab.addEventListener('click', () => switchRole(tab.dataset.role));
    tab.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        const nextRole = activeRole === 'Chofer' ? 'Copiloto' : 'Chofer';
        switchRole(nextRole);
        document.querySelector(`.role-tab[data-role="${nextRole}"]`).focus();
      }
    });
  });

  document.querySelectorAll('[data-add-role]').forEach(button => {
    button.addEventListener('click', () => {
      if (button.dataset.addRole !== activeRole) switchRole(button.dataset.addRole);
      else clearForm();
      nameInput.focus();
    });
  });

  search.addEventListener('input', () => { currentPage = 1; render(); });
  document.getElementById('page-prev').addEventListener('click', () => { currentPage -= 1; render(); });
  document.getElementById('page-next').addEventListener('click', () => { currentPage += 1; render(); });
  document.getElementById('form-cancel').addEventListener('click', clearForm);
  roleInput.addEventListener('change', updateRoleIcon);
  statusInput.addEventListener('change', updateStatusDot);
  nameInput.addEventListener('input', () => nameInput.setCustomValidity(''));
  phoneInput.addEventListener('input', () => phoneInput.setCustomValidity(''));

  rows.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const person = people.find(item => item.id === button.dataset.id);
    if (!person) return;
    if (button.dataset.action === 'view') showPerson(person);
    if (button.dataset.action === 'edit') editPerson(person);
    if (button.dataset.action === 'delete' && window.confirm(`¿Eliminar a ${person.name}?`)) {
      people = people.filter(item => item.id !== person.id);
      if (editingId === person.id) clearForm();
      const saved = savePeople();
      render();
      feedback.textContent = saved ? 'Registro eliminado.' : 'Registro eliminado solo en esta sesión.';
    }
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    if (!name) {
      nameInput.setCustomValidity('Ingresa un nombre.');
      nameInput.reportValidity();
      return;
    }
    if (phone.replace(/\D/g, '').length < 8) {
      phoneInput.setCustomValidity('Ingresa un teléfono válido.');
      phoneInput.reportValidity();
      return;
    }
    const record = {
      id: editingId || `person-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name,
      role: roleInput.value,
      phone,
      document: documentInput.value.trim(),
      license: licenseInput.value.trim(),
      status: statusInput.value
    };
    if (editingId) {
      const index = people.findIndex(person => person.id === editingId);
      if (index < 0) return;
      people[index] = record;
    } else {
      people.push(record);
    }
    const wasEditing = Boolean(editingId);
    const saved = savePeople();
    if (record.role !== activeRole) switchRole(record.role);
    else clearForm();
    search.value = '';
    const roleCount = people.filter(person => person.role === activeRole).length;
    currentPage = Math.max(1, Math.ceil(roleCount / pageSize));
    render();
    feedback.textContent = saved
      ? (wasEditing ? 'Registro actualizado.' : 'Registro guardado.')
      : (wasEditing ? 'Registro actualizado solo en esta sesión.' : 'Registro guardado solo en esta sesión.');
  });

  document.getElementById('dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  updateRoleIcon();
  updateStatusDot();
  render();
});
