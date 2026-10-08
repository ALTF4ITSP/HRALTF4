document.addEventListener('DOMContentLoaded', () => {
  const detail = document.getElementById('transfer-detail');
  const editForm = document.getElementById('edit-form');
  const editDialog = document.getElementById('edit-dialog');
  const statusDialog = document.getElementById('status-dialog');
  const cancelDialog = document.getElementById('cancel-dialog');
  const statusSelect = document.getElementById('transfer-status');
  const message = document.getElementById('view-message');
  const editableFields = ['ambulance', 'driver', 'origin', 'destination', 'patient', 'companion', 'reason', 'priority', 'notes'];
  const statusLabels = { 'in-progress': 'En curso', arrived: 'En destino', completed: 'Finalizado', cancelled: 'Cancelado' };
  // This view uses the site's sample transfer; retain edits only in this browser tab.
  const storageKey = 'hospitalTransfer1View';
  let transfer = { status: 'in-progress', finishedAt: '' };
  editableFields.forEach((field) => {
    transfer[field] = detail.querySelector(`[data-field="${field}"]`).textContent;
  });

  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey));
    if (saved && Object.hasOwn(statusLabels, saved.status) &&
        editableFields.every((field) => typeof saved[field] === 'string' &&
          saved[field].length <= (editForm.elements.namedItem(field).maxLength || 16) &&
          (!editForm.elements.namedItem(field).required || saved[field].trim())) &&
        ['Normal', 'Baja', 'Alta', 'Crítica'].includes(saved.priority) &&
        typeof saved.finishedAt === 'string' &&
        (!saved.finishedAt || Number.isFinite(Date.parse(saved.finishedAt)))) {
      transfer = { ...transfer, ...saved };
    }
  } catch (error) {
    // A restricted browser session can still use all controls without storage.
  }

  function renderTransfer() {
    editableFields.forEach((field) => {
      detail.querySelectorAll(`[data-field="${field}"]`).forEach((element) => {
        element.textContent = transfer[field] || '—';
      });
    });
    detail.dataset.status = transfer.status;
    detail.dataset.priority = transfer.priority;
    detail.querySelectorAll('[data-status-label]').forEach((element) => {
      element.textContent = statusLabels[transfer.status];
    });
    const finished = transfer.status === 'completed' || transfer.status === 'cancelled';
    document.getElementById('cancel-transfer').disabled = finished;
    document.getElementById('update-status').disabled = finished;
    document.getElementById('edit-transfer').disabled = finished;
    document.getElementById('final-event-title').textContent = transfer.status === 'cancelled' ? 'Traslado cancelado' : 'Traslado finalizado';
    document.getElementById('final-event-time').textContent = finished && transfer.finishedAt
      ? new Intl.DateTimeFormat('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(transfer.finishedAt))
      : 'Pendiente';
    document.getElementById('final-event-description').textContent = transfer.status === 'cancelled'
      ? 'El traslado fue cancelado.'
      : transfer.status === 'completed' ? 'El traslado ha finalizado.' : 'Se finalizará al llegar al destino.';
    document.getElementById('elapsed-time').textContent = finished ? '—' : '12 min';
    const arrival = detail.querySelector('.timeline-estimated');
    arrival.querySelector('strong').textContent = transfer.status === 'arrived' ? 'En destino' : 'Llegada estimada';
    arrival.querySelector('p').textContent = transfer.status === 'arrived'
      ? 'La ambulancia se encuentra en el destino.' : 'Tiempo previsto de llegada al destino.';
    arrival.querySelector('time').hidden = transfer.status === 'arrived';
  }

  function saveTransfer(nextTransfer, successMessage) {
    transfer = nextTransfer;
    let stored = true;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(transfer));
    } catch (error) {
      stored = false;
    }
    renderTransfer();
    message.textContent = successMessage + (stored ? ' En esta sesión.' : ' Solo en esta vista.');
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

  document.getElementById('edit-transfer').addEventListener('click', (event) => {
    editableFields.forEach((field) => { editForm.elements.namedItem(field).value = transfer[field]; });
    document.getElementById('edit-message').textContent = '';
    openDialog(editDialog, event.currentTarget);
  });
  editForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const nextTransfer = { ...transfer };
    for (const field of editableFields) {
      const control = editForm.elements.namedItem(field);
      const value = control.value.trim();
      if (control.required && !value) {
        document.getElementById('edit-message').textContent = 'Completa los campos obligatorios.';
        control.focus();
        return;
      }
      nextTransfer[field] = value;
    }
    saveTransfer(nextTransfer, 'Cambios guardados.');
    editDialog.close();
  });

  document.getElementById('update-status').addEventListener('click', (event) => {
    statusSelect.value = transfer.status;
    // State changes only move forward through the transfer lifecycle.
    statusSelect.querySelector('[value="in-progress"]').disabled = transfer.status === 'arrived';
    openDialog(statusDialog, event.currentTarget);
  });
  document.getElementById('status-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const status = statusSelect.value;
    if (!Object.hasOwn(statusLabels, status) || status === 'cancelled' ||
        (transfer.status === 'arrived' && status === 'in-progress')) return;
    saveTransfer({ ...transfer, status, finishedAt: status === 'completed' ? new Date().toISOString() : '' }, 'Estado actualizado.');
    statusDialog.close();
  });
  document.getElementById('cancel-transfer').addEventListener('click', (event) => {
    openDialog(cancelDialog, event.currentTarget);
  });
  document.getElementById('cancel-form').addEventListener('submit', (event) => {
    event.preventDefault();
    saveTransfer({ ...transfer, status: 'cancelled', finishedAt: new Date().toISOString() }, 'Traslado cancelado.');
    cancelDialog.close();
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

  // A read-only Leaflet preview fills the existing slot; the link opens the fleet map.
  const mapSpace = detail.querySelector('.map-space');
  const routeLink = document.getElementById('route-map-link');
  const mapStatus = document.getElementById('map-preview-status');
  const route = window.TraceMapShared?.getTransfer(Number(detail.dataset.transferId));
  let routeMap;
  let mapFrame;

  function resizeRoutePreview() {
    if (!mapSpace.clientWidth || !mapSpace.clientHeight) return;
    if (!window.L || !route) {
      mapStatus.textContent = 'Abrir ruta en el mapa';
      return;
    }
    if (!routeMap) {
      routeLink.href = `trace-map.html?transfer=${route.id}`;
      routeLink.setAttribute('aria-label', `Abrir ${route.name} en el mapa de traslados`);
      routeMap = L.map('ambulance-map', {
        zoomControl: false, attributionControl: true, dragging: false,
        touchZoom: false, scrollWheelZoom: false, doubleClickZoom: false,
        boxZoom: false, keyboard: false, zoomAnimation: false
      });
      routeMap.attributionControl.setPrefix(false);
      window.TraceMapShared.createBasemap(routeMap, {
        onLoad: () => { mapStatus.hidden = true; },
        onError: () => { mapStatus.textContent = 'Abrir ruta en el mapa'; }
      });
      L.polyline(route.coordinates, {
        color: route.color, weight: 3, opacity: 1, interactive: false
      }).addTo(routeMap);
      [route.coordinates[0], route.coordinates[route.coordinates.length - 1]].forEach((point) => {
        L.circleMarker(point, {
          radius: 4, color: route.color, weight: 2,
          fillColor: '#101732', fillOpacity: 1, interactive: false
        }).addTo(routeMap);
      });
      L.marker(route.currentPosition, {
        interactive: false, keyboard: false,
        icon: L.divIcon({
          className: 'route-preview-marker', iconSize: [22, 22], iconAnchor: [11, 11],
          html: `<span class="route-preview-vehicle" style="--route-color:${route.color}"></span>`
        })
      }).addTo(routeMap);
    }
    routeMap.invalidateSize({ pan: false });
    routeMap.fitBounds(route.coordinates, { padding: [14, 14], maxZoom: 15, animate: false });
  }

  new ResizeObserver(() => {
    cancelAnimationFrame(mapFrame);
    mapFrame = requestAnimationFrame(resizeRoutePreview);
  }).observe(mapSpace);

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
  renderTransfer();
});
