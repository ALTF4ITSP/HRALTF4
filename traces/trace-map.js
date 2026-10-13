/*
 * Montevideo fleet dashboard. No build step or paid map API is required.
 * Set the carto-basemap-key meta tag (or TRACE_MAP_CONFIG.cartoApiKey) for CARTO
 * Dark Matter. OpenStreetMap is the keyless default and the tile-error fallback.
 * Demo GPS is isolated below; real data can call TraceMap.updateTransfer(patch).
 */
(() => {
  'use strict';

  const ICON_ROOT = new URL('../../../assets/Icons/', document.currentScript.src).href;
  const CENTER = [-34.8833, -56.1667];
  const INITIAL_ZOOM = 12.5;
  const STATUS = Object.freeze({
    'EN CURSO': { className: 'status-progress', label: 'En curso' },
    PROGRAMADO: { className: 'status-scheduled', label: 'Programado' },
    DEMORADO: { className: 'status-delayed', label: 'Demorado' }
  });

  const transfers = window.TraceMapShared.getTransfers();
  const requestedTransfer = Number(new URLSearchParams(window.location.search).get('transfer'));
  const initialTransfer = transfers.find((item) => item.id === requestedTransfer) || transfers[0];

  const $ = (id) => document.getElementById(id);
  const elements = {
    search: $('transfer-search'), list: $('transfer-list'), panel: $('transfer-panel'), sidebar: $('map-sidebar'),
    stage: $('map-stage'), legend: $('legend-list'), loading: $('map-loading'),
    dialog: $('detail-dialog'), dialogContent: $('detail-content')
  };
  const state = {
    selectedId: initialTransfer.id, statuses: new Set(Object.keys(STATUS)), query: '',
    showRoutes: true, showDestinations: true, showNeighborhoods: true
  };
  const routeLayers = new Map();
  const externallyUpdated = new Set();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The shared sidebar changes the available canvas width independently of the
  // viewport. Keep the original compact overlay layout tied to that actual space.
  const compactScreen = { get matches() { return elements.stage.clientWidth <= 700; } };
  let map = null;
  let popup = null;
  let neighborhoods = null;
  let locationMarker = null;
  let toastTimeout;
  let simulationTimer;
  let animationFrame;
  let popupVisible = true;
  let lastDialogTrigger = null;

  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  const normalize = (value) => String(value).normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const icon = (name, className = 'icon') => `<span class="${className}" style="--icon-image:url('${ICON_ROOT}${name}')" aria-hidden="true"></span>`;
  const badge = (transfer) => `<span class="status-badge ${STATUS[transfer.status].className}">${escapeHTML(transfer.status)}</span>`;
  const vehicleBadge = (transfer) => `<span class="vehicle-badge" style="--route-color:${transfer.color}">${icon('steering-wheel.svg')}</span>`;

  function getVisibleTransfers() {
    const words = normalize(state.query).split(' ').filter(Boolean);
    return transfers.filter((transfer) => state.statuses.has(transfer.status) && words.every((word) =>
      normalize(`${transfer.id} ${transfer.name} ${transfer.ambulance} ${transfer.origin} ${transfer.destination} ${transfer.status}`).includes(word)
    ));
  }

  function renderList(visible) {
    const focusedId = document.activeElement?.closest('.transfer-card')?.dataset.transferId;
    elements.list.innerHTML = visible.map((transfer) => `
      <button class="transfer-card" type="button" data-transfer-id="${transfer.id}"
        aria-pressed="${transfer.id === state.selectedId}" style="--route-color:${transfer.color}"
        aria-label="${escapeHTML(`${transfer.name}, Ambulancia ${transfer.ambulance}, ${STATUS[transfer.status].label}, destino ${transfer.destination}, llegada estimada ${transfer.eta}`)}">
        <span class="transfer-card-top">
          ${vehicleBadge(transfer)}
          <span class="transfer-card-copy">
            <span class="transfer-card-title"><strong>${escapeHTML(transfer.name)}</strong>${badge(transfer)}</span>
            <span class="ambulance-name">Ambulancia ${escapeHTML(transfer.ambulance)}</span>
          </span>
        </span>
        <span class="card-destination"><span aria-hidden="true">→</span><span>${escapeHTML(transfer.destination)}</span></span>
        <span class="transfer-card-footer"><span>${icon('time-icon.svg')}Llegada estimada</span><time datetime="${transfer.eta}">${transfer.eta}</time></span>
      </button>`).join('');
    if (focusedId) elements.list.querySelector(`[data-transfer-id="${focusedId}"]`)?.focus({ preventScroll: true });
    $('empty-state').hidden = visible.length > 0;
    $('visible-count').textContent = visible.length;
    $('result-announcement').textContent = `${visible.length} ${visible.length === 1 ? 'traslado visible' : 'traslados visibles'}`;
  }

  function renderLegend(visible) {
    elements.legend.innerHTML = visible.length ? visible.map((transfer) => `
      <button class="legend-row" type="button" data-transfer-id="${transfer.id}" style="--route-color:${transfer.color}"
        aria-label="Seleccionar ${escapeHTML(transfer.name)}">
        <span class="legend-line" aria-hidden="true"></span><span>Traslado ${transfer.id}</span>
        <small>${STATUS[transfer.status].label}</small>
      </button>`).join('') : '<p class="legend-empty">Sin rutas visibles</p>';
  }

  function renderMetrics() {
    $('total-count').textContent = transfers.length;
    $('progress-count').textContent = transfers.filter((item) => item.status === 'EN CURSO').length;
    $('scheduled-count').textContent = transfers.filter((item) => item.status === 'PROGRAMADO').length;
    $('delayed-count').textContent = transfers.filter((item) => item.status === 'DEMORADO').length;
    document.querySelectorAll('#filter-panel input[name="status"]').forEach((input) => {
      input.parentElement.querySelector('.filter-number').textContent = transfers.filter((item) => item.status === input.value).length;
    });
    const excluded = Object.keys(STATUS).length - state.statuses.size;
    $('filter-count').textContent = excluded;
    $('filter-count').hidden = excluded === 0;
    $('filter-toggle').classList.toggle('has-filters', excluded > 0);
  }

  function setLayerVisible(layer, visible) {
    if (!map || !layer) return;
    if (visible && !map.hasLayer(layer)) layer.addTo(map);
    else if (!visible && map.hasLayer(layer)) map.removeLayer(layer);
  }

  function renderMapLayers(visible) {
    if (!map) return;
    const visibleIds = new Set(visible.map((item) => item.id));
    routeLayers.forEach((layers, id) => {
      const isVisible = visibleIds.has(id);
      setLayerVisible(layers.route, isVisible && state.showRoutes);
      setLayerVisible(layers.stops, isVisible && state.showDestinations);
      setLayerVisible(layers.vehicle, isVisible);
      layers.vehicle.getElement()?.classList.toggle('selected', id === state.selectedId);
      layers.line.setStyle({ opacity: id === state.selectedId ? 1 : .8, weight: id === state.selectedId ? 4 : 3 });
    });
    setLayerVisible(neighborhoods, state.showNeighborhoods);
  }

  function renderAll({ reopenPopup = false } = {}) {
    const visible = getVisibleTransfers();
    let selectionChanged = false;
    if (!visible.some((item) => item.id === state.selectedId)) {
      state.selectedId = visible[0]?.id ?? null;
      popupVisible = true;
      reopenPopup = true;
      selectionChanged = true;
    }
    renderList(visible);
    renderLegend(visible);
    renderMetrics();
    renderMapLayers(visible);
    if (map && state.selectedId === null) {
      map.closePopup();
    } else if (map && reopenPopup && popupVisible) {
      const selected = transfers.find((item) => item.id === state.selectedId);
      showTransferPopup(selected);
      if (selectionChanged) panToTransfer(selected);
    }
  }

  function popupContent(transfer) {
    return `<div class="popup-inner" style="--route-color:${transfer.color}">
      <div class="popup-heading">${vehicleBadge(transfer)}<div class="popup-identity">
        <div class="popup-title"><strong>${escapeHTML(transfer.name)}</strong>${badge(transfer)}</div>
        <p>Ambulancia ${escapeHTML(transfer.ambulance)}</p>
      </div></div>
      <div class="popup-route">${escapeHTML(transfer.origin)} <span aria-hidden="true">→</span> ${escapeHTML(transfer.destination)}</div>
      <div class="popup-eta">${icon('time-icon.svg')}<span>Llegada estimada</span><time datetime="${transfer.eta}">${transfer.eta}</time></div>
      <button class="details-button" type="button" data-detail-id="${transfer.id}">Ver detalles<span aria-hidden="true">↗</span></button>
    </div>`;
  }

  function showTransferPopup(transfer) {
    if (!map || !transfer) return;
    popupVisible = true;
    popup.setLatLng(transfer.currentPosition).setContent(popupContent(transfer)).openOn(map);
  }

  // Pan the ambulance into the unobstructed map region rather than underneath
  // the transfer panel. Popup position remains geographically anchored.
  function panToTransfer(transfer) {
    if (!map || !transfer) return;
    const size = map.getSize();
    const point = map.latLngToContainerPoint(transfer.currentPosition);
    const panelShown = !elements.panel.hidden;
    const panelBounds = elements.panel.getBoundingClientRect();
    const stageBounds = elements.stage.getBoundingClientRect();
    const popupElement = popup?.getElement();
    const popupWidth = popupElement?.offsetWidth || 292;
    const popupHeight = popupElement?.offsetHeight || 210;
    const popupGap = popupElement ? parseFloat(getComputedStyle(popupElement).marginBottom) + 5 : 33;
    const controls = elements.stage.querySelector('.map-controls');
    const horizontalControls = controls.offsetWidth > controls.offsetHeight;
    const topInset = horizontalControls ? controls.offsetTop + controls.offsetHeight + 8 : 12;
    const left = !compactScreen.matches && panelShown ? panelBounds.left - stageBounds.left + panelBounds.width + 16 : 12;
    let right = size.x - 12;
    const legend = elements.stage.querySelector('.route-legend');
    if (legend.offsetWidth && legend.offsetLeft - 16 - left >= popupWidth + 16) right = legend.offsetLeft - 16;
    const x = Math.max(popupWidth / 2 + 12, Math.min(size.x - popupWidth / 2 - 12, (left + right) / 2));
    const bottomInset = compactScreen.matches && panelShown ? size.y - (panelBounds.top - stageBounds.top) + 12 : 25;
    const y = Math.min(size.y - bottomInset, Math.max(topInset + popupHeight + popupGap, size.y * .64));
    map.panBy([point.x - x, point.y - y], { animate: !reduceMotion, duration: .55 });
  }

  function selectTransfer(id, { pan = true, scroll = false } = {}) {
    const transfer = getVisibleTransfers().find((item) => item.id === Number(id));
    if (!transfer) return;
    if (compactScreen.matches && !elements.panel.hidden) setPanelVisible(false, { pan: false });
    state.selectedId = transfer.id;
    renderAll();
    showTransferPopup(transfer);
    if (pan) panToTransfer(transfer);
    if (scroll) {
      const card = elements.list.querySelector(`[data-transfer-id="${transfer.id}"]`);
      if (card) elements.list.scrollTo({ top: card.offsetTop - elements.list.offsetTop - 8, behavior: reduceMotion ? 'instant' : 'smooth' });
    }
  }

  function toast(message) {
    clearTimeout(toastTimeout);
    $('toast').textContent = message;
    $('toast').hidden = false;
    toastTimeout = setTimeout(() => { $('toast').hidden = true; }, 5500);
  }

  function createBasemap() {
    return window.TraceMapShared.createBasemap(map, {
      onLoad: () => { elements.loading.hidden = true; },
      onFallback: () => toast('Se activó el mapa alternativo de OpenStreetMap.'),
      onError: () => {
        elements.loading.hidden = true;
        toast('No se pudo cargar el mapa. Revisa tu conexión a internet.');
      }
    });
  }

  function makeVehicleIcon(transfer) {
    return L.divIcon({
      className: 'vehicle-marker', iconSize: [39, 39], iconAnchor: [19.5, 19.5],
      html: `<div class="map-vehicle" style="--route-color:${transfer.color}">${icon('steering-wheel.svg')}</div>`
    });
  }

  function initializeMap() {
    if (compactScreen.matches) setPanelVisible(false, { pan: false });
    if (!window.L) {
      elements.loading.hidden = true;
      toast('No se pudo iniciar el mapa. Revisa tu conexión y recarga la página.');
      ['zoom-in', 'zoom-out', 'locate', 'layers-toggle', 'fullscreen-toggle', 'reset-view'].forEach((id) => { $(id).disabled = true; });
      return;
    }
    map = L.map('fleet-map', {
      zoomControl: false, attributionControl: true, zoomSnap: .5, zoomDelta: .5,
      minZoom: 10, maxZoom: 19, scrollWheelZoom: true,
      closePopupOnClick: false, preferCanvas: false
    }).setView(CENTER, INITIAL_ZOOM);
    map.attributionControl.setPrefix(false);
    map.createPane('neighborhoods');
    map.getPane('neighborhoods').style.zIndex = 350;
    map.getPane('neighborhoods').style.pointerEvents = 'none';
    createBasemap();
    L.control.scale({ position: 'bottomleft', imperial: false, maxWidth: 85 }).addTo(map);

    neighborhoods = L.layerGroup([
      ['Prado', -34.854, -56.205], ['Aires Puros', -34.842, -56.179],
      ['Casavalle', -34.821, -56.145], ['Maroñas', -34.847, -56.120],
      ['La Comercial', -34.882, -56.184], ['La Blanqueada', -34.878, -56.151],
      ['Unión', -34.869, -56.129], ['Malvín', -34.893, -56.101],
      ['Carrasco', -34.882, -56.056], ['Cordón', -34.899, -56.176],
      ['Centro', -34.905, -56.194], ['Ciudad Vieja', -34.911, -56.210],
      ['Buceo', -34.900, -56.132], ['Punta Carretas', -34.923, -56.157]
    ].map(([name, lat, lng]) => L.marker([lat, lng], {
      pane: 'neighborhoods', interactive: false, keyboard: false,
      icon: L.divIcon({ className: 'neighborhood-marker', html: escapeHTML(name), iconSize: [100, 12], iconAnchor: [50, 6] })
    }))).addTo(map);

    transfers.forEach((transfer) => {
      const halo = L.polyline(transfer.coordinates, { color: transfer.color, weight: 10, opacity: .11, interactive: false });
      const line = L.polyline(transfer.coordinates, { color: transfer.color, weight: 3, opacity: .85, lineCap: 'round', lineJoin: 'round' });
      const flow = L.polyline(transfer.coordinates, {
        color: '#ffffff', weight: 1.5, opacity: .5, dashArray: '3 22',
        className: 'route-flow', interactive: false
      });
      line.on('click', () => selectTransfer(transfer.id, { scroll: true }));
      const route = L.layerGroup([halo, line, flow]).addTo(map);
      const stops = L.layerGroup([
        L.marker(transfer.coordinates[0], {
          keyboard: false, title: transfer.origin,
          icon: L.divIcon({ className: 'waypoint-marker', iconSize: [23, 23], iconAnchor: [11.5, 11.5], html: `<span class="waypoint origin" style="--route-color:${transfer.color}"></span>` })
        }).bindTooltip(escapeHTML(transfer.origin), { direction: 'top', offset: [0, -8] }),
        L.marker(transfer.coordinates[transfer.coordinates.length - 1], {
          keyboard: false, title: transfer.destination,
          icon: L.divIcon({ className: 'waypoint-marker', iconSize: [23, 23], iconAnchor: [11.5, 11.5], html: `<span class="waypoint" style="--route-color:${transfer.color}">${icon('plus-icon.svg')}</span>` })
        }).bindTooltip(escapeHTML(transfer.destination), { direction: 'top', offset: [0, -12] })
      ]).addTo(map);
      const vehicle = L.marker(transfer.currentPosition, {
        icon: makeVehicleIcon(transfer), title: `${transfer.name} · Ambulancia ${transfer.ambulance}`,
        alt: `Ambulancia ${transfer.ambulance}`, zIndexOffset: 500, keyboard: true,
        riseOnHover: true
      }).addTo(map);
      vehicle.on('click', () => selectTransfer(transfer.id, { scroll: true }));
      // Reapply accessible names whenever filtering reattaches a div marker.
      const labelVehicle = () => {
        vehicle.getElement()?.setAttribute('role', 'button');
        vehicle.getElement()?.setAttribute('aria-label', `Ver ${transfer.name}, Ambulancia ${transfer.ambulance}`);
      };
      vehicle.on('add', labelVehicle);
      labelVehicle();
      routeLayers.set(transfer.id, { route, line, stops, vehicle });
    });
    popup = L.popup({
      className: 'transfer-popup', maxWidth: 310, minWidth: 250,
      autoPan: false, closeButton: true, offset: [0, -5]
    });
    popup.on('remove', () => { popupVisible = false; });
    popup.on('add', () => {
      popupVisible = true;
      const close = popup.getElement()?.querySelector('.leaflet-popup-close-button');
      close?.setAttribute('aria-label', 'Cerrar información del traslado');
      close?.setAttribute('title', 'Cerrar');
    });
    map.on('zoomend', () => {
      $('zoom-in').disabled = map.getZoom() >= map.getMaxZoom();
      $('zoom-out').disabled = map.getZoom() <= map.getMinZoom();
    });
    map.on('locationfound', (event) => {
      if (locationMarker) map.removeLayer(locationMarker);
      locationMarker = L.marker(event.latlng, {
        icon: L.divIcon({ className: 'user-location-marker', iconSize: [14, 14], iconAnchor: [7, 7] }),
        title: 'Tu ubicación'
      }).addTo(map);
      map.setView(event.latlng, Math.min(15, map.getMaxZoom()), { animate: !reduceMotion });
      $('locate').disabled = false;
      toast('Mapa centrado en tu ubicación.');
    });
    map.on('locationerror', () => {
      $('locate').disabled = false;
      toast('No se pudo obtener tu ubicación. Habilita el permiso de ubicación en el navegador.');
    });
    new ResizeObserver(() => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        map.invalidateSize({ pan: false });
        if (compactScreen.matches && popupVisible && !elements.panel.hidden) setPanelVisible(false, { pan: false });
        const selected = transfers.find((item) => item.id === state.selectedId);
        if (selected && popupVisible) panToTransfer(selected);
      });
    }).observe(elements.stage);
    renderAll({ reopenPopup: true });
    // Start at the requested center/zoom, then reveal the selected ambulance in
    // the unobstructed map area so its inspection card is visible at every size.
    panToTransfer(initialTransfer);
    startDemoTracking();
  }

  function distanceBetween(a, b) {
    const radians = (degrees) => degrees * Math.PI / 180;
    const dLat = radians(b[0] - a[0]);
    const dLng = radians(b[1] - a[1]);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a[0])) * Math.cos(radians(b[0])) * Math.sin(dLng / 2) ** 2;
    return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  function routeDistance(transfer) {
    return transfer.coordinates.slice(1).reduce((sum, point, index) => sum + distanceBetween(transfer.coordinates[index], point), 0);
  }

  function startDemoTracking() {
    // This explicitly simulated source pauses in background tabs and yields to
    // real updates per vehicle. It never generates operational patient data.
    const progress = new Map(transfers.map((transfer) => {
      const index = transfer.coordinates.findIndex((point) => point[0] === transfer.currentPosition[0] && point[1] === transfer.currentPosition[1]);
      return [transfer.id, Math.max(0, index)];
    }));
    simulationTimer = setInterval(() => {
      if (document.hidden || !map) return;
      transfers.forEach((transfer) => {
        if (transfer.status === 'PROGRAMADO' || externallyUpdated.has(transfer.id)) return;
        const current = progress.get(transfer.id);
        const segment = Math.floor(current);
        if (segment >= transfer.coordinates.length - 1) return;
        const a = transfer.coordinates[segment];
        const b = transfer.coordinates[segment + 1];
        const speed = transfer.status === 'DEMORADO' ? 1.5 : 7;
        const next = Math.min(transfer.coordinates.length - 1, current + speed * 2.5 / Math.max(1, distanceBetween(a, b)));
        progress.set(transfer.id, next);
        const nextSegment = Math.min(Math.floor(next), transfer.coordinates.length - 2);
        const fraction = Math.min(1, next - nextSegment);
        const from = transfer.coordinates[nextSegment];
        const to = transfer.coordinates[nextSegment + 1];
        transfer.currentPosition = [from[0] + (to[0] - from[0]) * fraction, from[1] + (to[1] - from[1]) * fraction];
        routeLayers.get(transfer.id).vehicle.setLatLng(transfer.currentPosition);
        if (state.selectedId === transfer.id && popupVisible && map.hasLayer(popup)) popup.setLatLng(transfer.currentPosition);
      });
      $('panel-update').textContent = 'Ahora';
    }, 2500);
  }

  function openDetails(id, trigger) {
    const transfer = transfers.find((item) => item.id === Number(id));
    if (!transfer) return;
    lastDialogTrigger = trigger || document.activeElement;
    elements.dialog.style.setProperty('--route-color', transfer.color);
    const distance = (routeDistance(transfer) / 1000).toLocaleString('es-UY', { maximumFractionDigits: 1 });
    elements.dialogContent.innerHTML = `
      <div style="--route-color:${transfer.color}">${vehicleBadge(transfer)}</div>
      <h2 id="detail-title">${escapeHTML(transfer.name)}</h2>
      <p class="detail-subtitle">Ambulancia ${escapeHTML(transfer.ambulance)} &nbsp; ${badge(transfer)}</p>
      <div class="detail-route" style="--route-color:${transfer.color}">
        <div class="detail-stop"><small>Origen</small><strong>${escapeHTML(transfer.origin)}</strong></div>
        <div class="detail-stop"><small>Destino</small><strong>${escapeHTML(transfer.destination)}</strong></div>
      </div>
      <dl class="detail-stats"><div><dt>Llegada estimada</dt><dd><time datetime="${transfer.eta}">${transfer.eta}</time></dd></div>
        <div><dt>Distancia de la ruta</dt><dd>${distance} <small>km</small></dd></div></dl>
      <p class="detail-demo-note">Datos de demostración. Las posiciones GPS y los horarios son simulados; la distancia es aproximada.</p>
      <button class="details-button" type="button" data-focus-route="${transfer.id}">Centrar en el mapa<span aria-hidden="true">↗</span></button>`;
    if (!elements.dialog.open) elements.dialog.showModal();
  }

  function resetFilters() {
    state.query = '';
    state.statuses = new Set(Object.keys(STATUS));
    elements.search.value = '';
    document.querySelectorAll('#filter-panel input[name="status"]').forEach((input) => { input.checked = true; });
    renderAll({ reopenPopup: true });
  }

  function setPanelVisible(visible, { pan = true } = {}) {
    elements.panel.hidden = !visible;
    $('list-toggle').setAttribute('aria-expanded', String(visible));
    const label = visible ? 'Ocultar lista de traslados' : 'Mostrar lista de traslados';
    $('list-toggle').setAttribute('aria-label', label);
    $('list-toggle').title = label;
    if (map && compactScreen.matches) {
      if (visible) map.closePopup();
      else if (pan && state.selectedId && !popupVisible) showTransferPopup(transfers.find((item) => item.id === state.selectedId));
    }
    if (pan && map && popupVisible && state.selectedId) {
      panToTransfer(transfers.find((item) => item.id === state.selectedId));
    }
  }

  const popovers = [
    { button: $('filter-toggle'), panel: $('filter-panel') },
    { button: $('layers-toggle'), panel: $('layers-panel') }
  ];

  function setSearchExpanded(expanded, { focus = true } = {}) {
    $('map-search').classList.toggle('search-active', expanded);
    $('search-toggle').setAttribute('aria-expanded', String(expanded));
    $('search-toggle').setAttribute('aria-label', expanded ? 'Cerrar búsqueda' : 'Abrir búsqueda');
    elements.search.setAttribute('aria-hidden', String(!expanded));
    elements.search.tabIndex = expanded ? 0 : -1;
    elements.search.hidden = !expanded;
    if (expanded && focus) elements.search.focus({ preventScroll: true });
    if (!expanded) {
      state.query = '';
      elements.search.value = '';
      renderAll({ reopenPopup: true });
      if (focus) $('search-toggle').focus({ preventScroll: true });
    }
  }

  function updateNavigationIndicator() {
    const active = document.querySelector('.sidebar-nav .nav-item.active');
    if (active) $('sidebar-links').style.setProperty('--indicator-top', `${active.offsetTop}px`);
  }

  function closePopovers(except = null) {
    popovers.forEach(({ button, panel }) => {
      if (panel === except) return;
      panel.hidden = true;
      button.setAttribute('aria-expanded', 'false');
    });
  }

  function bindEvents() {
    $('search-toggle').addEventListener('click', () => {
      setSearchExpanded(!$('map-search').classList.contains('search-active'));
    });
    elements.search.addEventListener('input', () => {
      state.query = elements.search.value;
      renderAll({ reopenPopup: true });
    });
    elements.list.addEventListener('click', (event) => {
      const card = event.target.closest('[data-transfer-id]');
      if (card) selectTransfer(card.dataset.transferId);
    });
    elements.legend.addEventListener('click', (event) => {
      const row = event.target.closest('[data-transfer-id]');
      if (row) selectTransfer(row.dataset.transferId, { scroll: true });
    });
    elements.stage.addEventListener('click', (event) => {
      const button = event.target.closest('[data-detail-id]');
      if (button) openDetails(button.dataset.detailId, button);
    });
    $('filter-panel').addEventListener('submit', (event) => event.preventDefault());
    $('filter-panel').addEventListener('change', () => {
      state.statuses = new Set([...document.querySelectorAll('#filter-panel input[name="status"]:checked')].map((input) => input.value));
      renderAll({ reopenPopup: true });
    });
    $('reset-filters').addEventListener('click', resetFilters);
    $('clear-search').addEventListener('click', resetFilters);
    $('list-toggle').addEventListener('click', () => setPanelVisible(elements.panel.hidden));
    $('menu-toggle').addEventListener('click', () => {
      const expanded = $('app-shell').classList.toggle('menu-open');
      $('menu-toggle').setAttribute('aria-expanded', String(expanded));
      $('menu-toggle').setAttribute('aria-label', expanded ? 'Cerrar menú' : 'Abrir menú');
      $('sidebar-links').inert = !expanded;
      $('sidebar-links').setAttribute('aria-hidden', String(!expanded));
      requestAnimationFrame(updateNavigationIndicator);
    });
    window.addEventListener('resize', updateNavigationIndicator);
    updateNavigationIndicator();
    popovers.forEach(({ button, panel }) => {
      button.addEventListener('click', () => {
        const opening = panel.hidden;
        closePopovers(panel);
        panel.hidden = !opening;
        button.setAttribute('aria-expanded', String(opening));
      });
    });
    document.addEventListener('click', (event) => {
      if (!popovers.some(({ button, panel }) => button.contains(event.target) || panel.contains(event.target))) closePopovers();
    });
    document.addEventListener('keydown', (event) => {
      const typing = event.target instanceof HTMLElement && (event.target.matches('input, textarea, select') || event.target.isContentEditable);
      if (event.key === '/' && !typing && !elements.dialog.open) {
        event.preventDefault();
        setSearchExpanded(true);
      }
      if (event.key === 'Escape') {
        if ($('map-search').classList.contains('search-active') && !elements.dialog.open) setSearchExpanded(false);
        const opened = popovers.find(({ panel }) => !panel.hidden);
        closePopovers();
        if (opened) opened.button.focus();
        if (elements.stage.classList.contains('expanded-map')) exitExpandedMap();
      }
    });
    $('zoom-in').addEventListener('click', () => map?.zoomIn(.5));
    $('zoom-out').addEventListener('click', () => map?.zoomOut(.5));
    $('locate').addEventListener('click', () => {
      if (!map) return;
      $('locate').disabled = true;
      map.locate({ setView: false, maxZoom: 15, timeout: 10000, enableHighAccuracy: false });
    });
    $('show-routes').addEventListener('change', (event) => { state.showRoutes = event.target.checked; renderMapLayers(getVisibleTransfers()); });
    $('show-destinations').addEventListener('change', (event) => { state.showDestinations = event.target.checked; renderMapLayers(getVisibleTransfers()); });
    $('show-neighborhoods').addEventListener('change', (event) => { state.showNeighborhoods = event.target.checked; renderMapLayers(getVisibleTransfers()); });
    $('fit-fleet').addEventListener('click', () => {
      if (!map) return;
      const points = getVisibleTransfers().flatMap((item) => item.coordinates);
      if (!points.length) { toast('No hay rutas visibles para centrar.'); return; }
      map.closePopup();
      const leftPadding = !compactScreen.matches && !elements.panel.hidden ? elements.panel.offsetWidth + 45 : 35;
      const bottomPadding = compactScreen.matches && !elements.panel.hidden ? elements.sidebar.offsetHeight + 35 : 55;
      map.fitBounds(L.latLngBounds(points), { paddingTopLeft: [leftPadding, 55], paddingBottomRight: [80, bottomPadding], maxZoom: 14, animate: !reduceMotion });
      closePopovers();
    });
    $('reset-view').addEventListener('click', () => {
      if (!map) return;
      map.closePopup();
      map.setView(CENTER, INITIAL_ZOOM, { animate: !reduceMotion });
      toast('Vista de Montevideo restablecida.');
    });
    $('fullscreen-toggle').addEventListener('click', toggleFullscreen);
    document.addEventListener('fullscreenchange', () => {
      const active = document.fullscreenElement === elements.stage;
      $('fullscreen-toggle').setAttribute('aria-pressed', String(active));
      $('fullscreen-toggle').setAttribute('aria-label', active ? 'Salir de pantalla completa' : 'Pantalla completa');
      map?.invalidateSize();
    });
    $('close-details').addEventListener('click', () => elements.dialog.close());
    elements.dialog.addEventListener('click', (event) => {
      if (event.target.closest('[data-focus-route]')) {
        const id = event.target.closest('[data-focus-route]').dataset.focusRoute;
        elements.dialog.close();
        selectTransfer(id);
      } else if (event.target === elements.dialog) {
        const bounds = elements.dialog.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) elements.dialog.close();
      }
    });
    elements.dialog.addEventListener('close', () => {
      if (lastDialogTrigger?.isConnected) lastDialogTrigger.focus({ preventScroll: true });
    });
    window.addEventListener('pagehide', () => {
      clearInterval(simulationTimer);
      clearTimeout(toastTimeout);
    });
    window.addEventListener('pageshow', (event) => { if (event.persisted && map) startDemoTracking(); });
  }

  function exitExpandedMap() {
    elements.stage.classList.remove('expanded-map');
    $('fullscreen-toggle').setAttribute('aria-pressed', 'false');
    $('fullscreen-toggle').setAttribute('aria-label', 'Pantalla completa');
    map?.invalidateSize();
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement === elements.stage) { await document.exitFullscreen(); return; }
    if (elements.stage.classList.contains('expanded-map')) { exitExpandedMap(); return; }
    try {
      if (!elements.stage.requestFullscreen) throw new Error('Fullscreen API unavailable');
      await elements.stage.requestFullscreen();
    } catch {
      // Safari/iOS and embedded previews can deny native fullscreen. This local
      // layout fallback keeps the same control functional in those environments.
      elements.stage.classList.add('expanded-map');
      $('fullscreen-toggle').setAttribute('aria-pressed', 'true');
      $('fullscreen-toggle').setAttribute('aria-label', 'Salir de pantalla completa');
      map?.invalidateSize();
    }
  }

  // Public integration point: validate live source patches before applying them.
  // Calling this for a transfer stops demo GPS updates for that transfer.
  function updateTransfer(patch) {
    if (!patch || typeof patch !== 'object') throw new TypeError('Se requiere un objeto de traslado.');
    const transfer = transfers.find((item) => item.id === Number(patch.id));
    if (!transfer) throw new RangeError('El traslado no existe.');
    if (patch.status !== undefined && !Object.hasOwn(STATUS, patch.status)) throw new TypeError('Estado de traslado inválido.');
    if (patch.eta !== undefined && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(patch.eta)) throw new TypeError('La llegada estimada debe tener el formato HH:mm.');
    if (patch.currentPosition !== undefined) {
      const point = patch.currentPosition;
      if (!Array.isArray(point) || point.length !== 2 || !point.every(Number.isFinite) || Math.abs(point[0]) > 90 || Math.abs(point[1]) > 180) throw new TypeError('Coordenadas GPS inválidas.');
    }
    if (patch.status !== undefined) transfer.status = patch.status;
    if (patch.eta !== undefined) transfer.eta = patch.eta;
    if (patch.currentPosition !== undefined) {
      transfer.currentPosition = [...patch.currentPosition];
      routeLayers.get(transfer.id)?.vehicle.setLatLng(transfer.currentPosition);
    }
    externallyUpdated.add(transfer.id);
    renderAll({ reopenPopup: state.selectedId === transfer.id && popupVisible });
    if (elements.dialog.open && elements.dialogContent.querySelector(`[data-focus-route="${transfer.id}"]`)) openDetails(transfer.id, lastDialogTrigger);
    $('panel-update').textContent = 'Ahora';
  }

  window.TraceMap = Object.freeze({
    get transfers() { return transfers.map((item) => ({ ...item, currentPosition: [...item.currentPosition], coordinates: item.coordinates.map((point) => [...point]) })); },
    selectTransfer,
    updateTransfer
  });

  renderAll();
  bindEvents();
  initializeMap();
})();
