// Detalle de un traslado (trace-view.html?id=3). Los datos vienen de php/traslados.php
document.addEventListener('DOMContentLoaded', () => {
  const API = '../php/traslados.php';
  const id = new URLSearchParams(window.location.search).get('id');
  const detail = document.getElementById('transfer-detail');
  const statusDialog = document.getElementById('status-dialog');
  const cancelDialog = document.getElementById('cancel-dialog');
  const statusSelect = document.getElementById('transfer-status');
  const message = document.getElementById('view-message');

  const ESTADOS = { ASIGNADO: 'Asignado', EN_CURSO: 'En curso', EN_DESTINO: 'En destino', FINALIZADO: 'Finalizado', CANCELADO: 'Cancelado' };
  // data-status que usa el CSS del diseño original
  const ESTILO = { ASIGNADO: 'in-progress', EN_CURSO: 'in-progress', EN_DESTINO: 'arrived', FINALIZADO: 'completed', CANCELADO: 'cancelled' };
  const PASOS = { ASIGNADO: ['EN_CURSO'], EN_CURSO: ['EN_DESTINO', 'FINALIZADO'], EN_DESTINO: ['FINALIZADO'], FINALIZADO: [], CANCELADO: [] };
  const TIPOS = { PACIENTE: 'Paciente', EQUIPO: 'Elemento o equipo', BIOLOGICO: 'Biológico' };
  const PRIORIDADES = { BAJA: 'Baja', NORMAL: 'Normal', ALTA: 'Alta', CRITICA: 'Crítica' };
  let transfer = null;

  // "2026-10-15T09:30" → "15/10/2026 · 09:30"
  const fechaHora = value => {
    if (!value) return '—';
    const [fecha, hora] = value.split('T');
    return `${fecha.split('-').reverse().join('/')} · ${hora}`;
  };
  const minutos = (desde, hasta) => Math.round((new Date(hasta) - new Date(desde)) / 60000);
  const duracion = total => total >= 60 ? `${Math.floor(total / 60)} h ${total % 60} min` : `${total} min`;

  // Distancia en línea recta entre dos coordenadas (fórmula de Haversine)
  function kilometros(lat1, lng1, lat2, lng2) {
    const rad = Math.PI / 180;
    const a = Math.sin((lat2 - lat1) * rad / 2) ** 2 +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin((lng2 - lng1) * rad / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(a));
  }

  function setField(name, value) {
    detail.querySelectorAll(`[data-field="${name}"]`).forEach((element) => {
      element.textContent = value === null || value === undefined || value === '' ? '—' : value;
    });
  }

  function timelineItem(className, title, time, text) {
    return `<li class="${className}"><span class="timeline-dot" aria-hidden="true"></span><strong>${title}</strong>` +
      `<span>${time}</span><p>${text}</p></li>`;
  }

  function render() {
    const t = transfer;
    document.title = `Traslado ${t.id} | Hospital de Clínicas`;
    document.getElementById('transfer-title').textContent = `TRASLADO ${t.id}`;
    detail.dataset.status = ESTILO[t.estado];
    detail.dataset.priority = PRIORIDADES[t.prioridad];
    detail.querySelectorAll('[data-status-label]').forEach((element) => { element.textContent = ESTADOS[t.estado]; });

    setField('ambulance', t.matricula);
    setField('model', t.modelo);
    setField('created', `Creado el ${fechaHora(t.fecha_creacion).replace(' · ', ' a las ')}`);
    setField('start', fechaHora(t.fecha_salida));
    setField('origin', t.origen);
    setField('destination', t.destino);
    setField('driver', t.chofer);
    setField('companion', t.acompanante);
    setField('patient', t.paciente);
    setField('age', t.paciente_edad);
    setField('document', t.paciente_documento ? `CI ${t.paciente_documento}` : '');
    setField('patientNotes', t.paciente_diagnostico);
    setField('doctor', t.paciente_medico);
    setField('reason', t.motivo);
    setField('type', TIPOS[t.tipo]);
    setField('priority', PRIORIDADES[t.prioridad]);
    setField('options', t.opciones);
    setField('notes', t.notas);

    const conCoordenadas = [t.origen_lat, t.origen_lng, t.destino_lat, t.destino_lng].every(v => v !== null);
    setField('distance', conCoordenadas
      ? `${kilometros(+t.origen_lat, +t.origen_lng, +t.destino_lat, +t.destino_lng).toFixed(1).replace('.', ',')} km` : '');
    setField('duration', t.llegada_estimada ? duracion(minutos(t.fecha_salida, t.llegada_estimada)) : '');
    const enViaje = ['EN_CURSO', 'EN_DESTINO'].includes(t.estado);
    document.getElementById('elapsed-time').textContent =
      enViaje ? duracion(Math.max(0, minutos(t.fecha_salida, new Date()))) : '—';

    // Línea de tiempo
    const terminado = t.estado === 'FINALIZADO' || t.estado === 'CANCELADO';
    document.getElementById('timeline').innerHTML = [
      timelineItem('timeline-start', 'Traslado creado', fechaHora(t.fecha_creacion), 'Se registró el traslado.'),
      timelineItem(t.estado === 'ASIGNADO' ? 'timeline-current' : 'timeline-start', 'Salida',
        fechaHora(t.fecha_salida), `Desde ${t.origen}.`),
      timelineItem(t.estado === 'EN_DESTINO' ? 'timeline-current' : 'timeline-estimated',
        t.estado === 'EN_DESTINO' ? 'En destino' : 'Llegada estimada',
        fechaHora(t.llegada_estimada), `A ${t.destino}.`),
      timelineItem('timeline-final', t.estado === 'CANCELADO' ? 'Traslado cancelado' : 'Traslado finalizado',
        terminado ? fechaHora(t.fecha_fin) : 'Pendiente',
        terminado ? (t.estado === 'CANCELADO' ? 'El traslado fue cancelado.' : 'El traslado ha finalizado.') : 'Se finalizará al llegar al destino.')
    ].join('');

    // Un traslado terminado no se puede editar ni cambiar de estado
    document.getElementById('cancel-transfer').disabled = terminado;
    document.getElementById('update-status').disabled = terminado;
    document.getElementById('edit-transfer').disabled = terminado;
    document.getElementById('cancel-text').textContent =
      `¿Deseas cancelar el traslado ${t.id}? Esta acción marcará el traslado como cancelado.`;
    detail.hidden = false;
  }

  async function load() {
    try {
      const response = await fetch(`${API}?id=${encodeURIComponent(id || '')}`, { headers: { Accept: 'application/json' } });
      const data = await response.json();
      if (!response.ok || data.success !== true) throw new Error(data?.error?.message);
      transfer = data.data;
      render();
    } catch (error) {
      detail.hidden = false;
      document.getElementById('transfer-title').textContent = 'Traslado no encontrado';
      message.textContent = error.message || 'No se pudo cargar el traslado.';
    }
  }

  async function changeStatus(estado, successMessage) {
    try {
      const response = await fetch(API, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ accion: 'estado', id: transfer.id, estado })
      });
      const data = await response.json();
      if (!response.ok || data.success !== true) throw new Error(data?.error?.message);
      message.textContent = successMessage;
      await load();
    } catch (error) {
      message.textContent = error.message || 'No se pudo cambiar el estado.';
    }
  }

  const dialogTriggers = new Map();
  function openDialog(dialog, trigger) {
    dialogTriggers.set(dialog, trigger);
    dialog.showModal();
  }
  document.querySelectorAll('.transfer-dialog').forEach((dialog) => {
    dialog.querySelectorAll('[data-close-dialog]').forEach((button) => {
      button.addEventListener('click', () => dialog.close());
    });
    dialog.addEventListener('close', () => {
      const trigger = dialogTriggers.get(dialog);
      if (trigger?.disabled) document.querySelector('.back-link').focus();
      else trigger?.focus();
    });
  });

  // Editar usa el mismo formulario que "Nuevo traslado"
  document.getElementById('edit-transfer').addEventListener('click', () => {
    window.location.href = `trace-new.html?id=${transfer.id}`;
  });

  document.getElementById('update-status').addEventListener('click', (event) => {
    // Solo se ofrecen los estados a los que se puede avanzar
    statusSelect.querySelectorAll('option').forEach((option) => {
      option.disabled = !PASOS[transfer.estado].includes(option.value);
    });
    statusSelect.value = PASOS[transfer.estado][0] || '';
    openDialog(statusDialog, event.currentTarget);
  });
  document.getElementById('status-form').addEventListener('submit', (event) => {
    event.preventDefault();
    statusDialog.close();
    changeStatus(statusSelect.value, 'Estado actualizado.');
  });
  document.getElementById('cancel-transfer').addEventListener('click', (event) => {
    openDialog(cancelDialog, event.currentTarget);
  });
  document.getElementById('cancel-form').addEventListener('submit', (event) => {
    event.preventDefault();
    cancelDialog.close();
    changeStatus('CANCELADO', 'Traslado cancelado.');
  });

  // Tabs keep every section accessible when the screen is too narrow for the grid.
  const tabs = Array.from(document.querySelectorAll('.detail-tabs [role="tab"]'));
  function selectTab(tab) {
    tabs.forEach((item) => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      document.getElementById(item.dataset.panel).classList.toggle('is-selected', selected);
    });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (event) => {
      let nextIndex;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = tabs.length - 1;
      if (nextIndex === undefined) return;
      event.preventDefault();
      selectTab(tabs[nextIndex]);
      tabs[nextIndex].focus();
    });
  });
  const hero = document.querySelector('.trace-view-hero');
  new ResizeObserver(() => {
    const tabbed = getComputedStyle(document.querySelector('.detail-tabs')).display !== 'none';
    tabs.forEach((tab) => {
      const panel = document.getElementById(tab.dataset.panel);
      panel.setAttribute('role', tabbed ? 'tabpanel' : 'region');
      panel.setAttribute('aria-labelledby', tabbed ? tab.id : panel.querySelector('h2').id);
    });
  }).observe(hero);

  // Keep the imported navigation out of the keyboard order while collapsed.
  const shell = document.querySelector('.app-shell');
  const menuButton = document.querySelector('.sidebar-action');
  const navigation = document.querySelector('.sidebar-nav');
  function syncNavigation() {
    const open = shell.classList.contains('menu-open');
    navigation.inert = !open;
    menuButton.setAttribute('aria-expanded', String(open));
  }
  menuButton.addEventListener('click', syncNavigation);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && shell.classList.contains('menu-open') && !document.querySelector('dialog[open]')) {
      menuButton.click();
      menuButton.focus();
    }
  });
  syncNavigation();
  load();
});
