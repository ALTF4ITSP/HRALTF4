(() => {
  "use strict";

  const storageKey = "hospital.presetRoutes.v1";
  const categories = ["Interhospitalario", "Consulta", "Tratamiento", "Alta"];
  const initialRoutes = [
    { id: "route-001", code: "RT-001", name: "Clínicas → Hospital Maciel", category: "Interhospitalario", direction: "Solo ida", status: "Activa", origin: { name: "Hospital de Clínicas", address: "Av. Italia 2870, Montevideo" }, destination: { name: "Hospital Maciel", address: "25 de Mayo 174, Montevideo" }, stops: [], distance: 7.8, duration: 25, notes: "Salida por el acceso de ambulancias. Coordinar la recepción con el equipo de destino." },
    { id: "route-002", code: "RT-002", name: "Circuito de rehabilitación", category: "Tratamiento", direction: "Ida y vuelta", status: "Activa", origin: { name: "Hospital de Clínicas", address: "Av. Italia 2870, Montevideo" }, destination: { name: "Centro de rehabilitación", address: "Av. 8 de Octubre 3250, Montevideo" }, stops: [{ name: "Policlínica La Unión", address: "Larravide 2450, Montevideo" }], distance: 6.2, duration: 30, notes: "Confirmar el punto de encuentro antes de la salida. Contemplar asistencia en el ascenso y descenso." },
    { id: "route-003", code: "RT-003", name: "Clínicas → Hospital Pasteur", category: "Interhospitalario", direction: "Solo ida", status: "Activa", origin: { name: "Hospital de Clínicas", address: "Av. Italia 2870, Montevideo" }, destination: { name: "Hospital Pasteur", address: "Larravide 2458, Montevideo" }, stops: [], distance: 4.5, duration: 18, notes: "Ingreso por el acceso de traslados. Avisar al servicio receptor al iniciar el recorrido." },
    { id: "route-004", code: "RT-004", name: "Consulta · Ciudad Vieja", category: "Consulta", direction: "Ida y vuelta", status: "Activa", origin: { name: "Hospital de Clínicas", address: "Av. Italia 2870, Montevideo" }, destination: { name: "Policlínica Ciudad Vieja", address: "Piedras 720, Montevideo" }, stops: [], distance: 7.1, duration: 28, notes: "Coordinar el regreso al finalizar la consulta." },
    { id: "route-005", code: "RT-005", name: "Traslado a centro de diálisis", category: "Tratamiento", direction: "Ida y vuelta", status: "Activa", origin: { name: "Hospital de Clínicas", address: "Av. Italia 2870, Montevideo" }, destination: { name: "Centro de diálisis", address: "Bv. Artigas 1850, Montevideo" }, stops: [{ name: "Policlínica Cordón", address: "Colonia 1950, Montevideo" }], distance: 5.3, duration: 32, notes: "Confirmar con el centro la hora de recepción y el horario de regreso." },
    { id: "route-006", code: "RT-006", name: "Clínicas → Hospital Español", category: "Interhospitalario", direction: "Solo ida", status: "Inactiva", origin: { name: "Hospital de Clínicas", address: "Av. Italia 2870, Montevideo" }, destination: { name: "Hospital Español", address: "Av. Garibaldi 1729, Montevideo" }, stops: [], distance: 5.6, duration: 22, notes: "Revisar el acceso de recepción antes de reactivar la ruta." },
    { id: "route-007", code: "RT-007", name: "Alta · Residencia Parque", category: "Alta", direction: "Solo ida", status: "Activa", origin: { name: "Hospital de Clínicas", address: "Av. Italia 2870, Montevideo" }, destination: { name: "Residencia Parque", address: "Av. Sarmiento 2450, Montevideo" }, stops: [], distance: 3.8, duration: 15, notes: "Coordinar la entrega con el personal de la residencia." },
    { id: "route-008", code: "RT-008", name: "Circuito de consultas externas", category: "Consulta", direction: "Ida y vuelta", status: "Inactiva", origin: { name: "Hospital de Clínicas", address: "Av. Italia 2870, Montevideo" }, destination: { name: "Policlínica Norte", address: "Av. San Martín 4250, Montevideo" }, stops: [{ name: "Policlínica Goes", address: "Av. General Flores 2450, Montevideo" }, { name: "Centro de atención Reducto", address: "Av. Millán 2850, Montevideo" }], distance: 9.4, duration: 45, notes: "Verificar la disponibilidad de los centros antes de activar el circuito." }
  ];

  const byId = id => document.getElementById(id);
  const list = byId("route-list");
  const search = byId("route-search");
  const sort = byId("route-sort");
  const detail = byId("route-detail-content");
  const form = byId("route-form");
  const formDialog = byId("route-dialog");
  const deleteDialog = byId("delete-dialog");
  const stopEditor = byId("stop-editor");
  const formError = byId("form-error");
  const filters = [...document.querySelectorAll("[data-filter]")];
  const pagination = byId("route-pagination");
  let pageSize = 3;
  let routes = structuredClone(initialRoutes);
  let nextNumber = 9;
  let selectedId = routes[0].id;
  let currentPage = 1;
  let activeFilter = "Todas";
  let editingId = null;
  let pendingDeleteId = null;
  let draftStops = [];
  let toastTimer;
  let dialogTrigger;

  const normalize = value => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").trim();
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
  const formatDistance = value => new Intl.NumberFormat("es-UY", { maximumFractionDigits: 1 }).format(value);
  const icon = name => `<img src="../../../assets/Icons/${name}.svg" alt="">`;
  const validPlace = place => place && typeof place.name === "string" && place.name.trim().length > 0 && place.name.length <= 100 && typeof place.address === "string" && place.address.trim().length > 0 && place.address.length <= 160;

  function validRoute(route) {
    return route && typeof route.id === "string" && /^[\w-]+$/.test(route.id) && /^RT-\d+$/.test(route.code) &&
      typeof route.name === "string" && route.name.trim().length > 0 && route.name.length <= 80 && categories.includes(route.category) &&
      ["Solo ida", "Ida y vuelta"].includes(route.direction) && ["Activa", "Inactiva"].includes(route.status) &&
      validPlace(route.origin) && validPlace(route.destination) && Array.isArray(route.stops) && route.stops.length <= 6 && route.stops.every(validPlace) &&
      Number.isFinite(route.distance) && route.distance >= .1 && route.distance <= 2000 && Number.isInteger(route.duration) && route.duration >= 1 && route.duration <= 2880 &&
      typeof route.notes === "string" && route.notes.length <= 500;
  }

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved?.version === 1 && Array.isArray(saved.routes) && saved.routes.every(validRoute) &&
      new Set(saved.routes.map(route => route.id)).size === saved.routes.length &&
      new Set(saved.routes.map(route => route.code)).size === saved.routes.length && Number.isSafeInteger(saved.nextNumber) &&
      saved.nextNumber > Math.max(0, ...saved.routes.map(route => Number(route.code.slice(3))))) {
      routes = saved.routes;
      nextNumber = saved.nextNumber;
      selectedId = routes[0]?.id ?? null;
    }
  } catch {}

  function persist() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ version: 1, nextNumber, routes }));
      return true;
    } catch {
      return false;
    }
  }

  function notify(message) {
    const toast = byId("route-toast");
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = setTimeout(() => { toast.hidden = true; }, 5000);
  }

  function filteredRoutes() {
    const query = normalize(search.value);
    return routes.filter(route => {
      const terms = [route.code, route.name, route.category, route.origin.name, route.origin.address, route.destination.name, route.destination.address, ...route.stops.flatMap(stop => [stop.name, stop.address])].join(" ");
      return (activeFilter === "Todas" || route.status === activeFilter) && normalize(terms).includes(query);
    }).sort((a, b) => {
      if (sort.value === "name") return a.name.localeCompare(b.name, "es", { sensitivity: "base" }) || a.code.localeCompare(b.code);
      if (sort.value === "duration") return a.duration - b.duration || a.name.localeCompare(b.name, "es");
      return Number(a.code.slice(3)) - Number(b.code.slice(3));
    });
  }

  function statusPill(route) {
    return `<span class="status-pill${route.status === "Inactiva" ? " is-inactive" : ""}">${escapeHtml(route.status)}</span>`;
  }

  function renderPagination(pages) {
    let pageNumbers;
    if (pages <= 5) pageNumbers = Array.from({ length: pages }, (_, index) => index + 1);
    else if (currentPage <= 3) pageNumbers = [1, 2, 3, "…", pages];
    else if (currentPage >= pages - 2) pageNumbers = [1, "…", pages - 2, pages - 1, pages];
    else pageNumbers = [1, "…", currentPage, "…", pages];
    pagination.innerHTML = `<button type="button" id="page-prev" data-page="${currentPage - 1}" aria-label="Página anterior" ${currentPage === 1 ? "disabled" : ""}>‹</button>
      ${pageNumbers.map(page => typeof page === "number" ? `<button type="button" data-page="${page}" class="${page === currentPage ? "is-active" : ""}" aria-label="Página ${page}" ${page === currentPage ? 'aria-current="page"' : ""}>${page}</button>` : '<span class="pagination-ellipsis" aria-hidden="true">…</span>').join("")}
      <button type="button" id="page-next" data-page="${currentPage + 1}" aria-label="Página siguiente" ${currentPage === pages ? "disabled" : ""}>›</button>`;
  }

  function fitCatalogPage() {
    let capacity = 3;
    if (!window.matchMedia("(max-width: 770px)").matches) {
      if (!list.clientHeight) return;
      const style = getComputedStyle(list);
      const availableHeight = list.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      const cardHeight = parseFloat(style.getPropertyValue("--route-card-height"));
      const gap = parseFloat(style.rowGap);
      capacity = Math.max(1, Math.min(6, Math.floor((availableHeight + gap) / (cardHeight + gap))));
    }
    if (capacity === pageSize) return;
    pageSize = capacity;
    const selectedIndex = filteredRoutes().findIndex(route => route.id === selectedId);
    if (selectedIndex >= 0) currentPage = Math.floor(selectedIndex / pageSize) + 1;
    const focusedRoute = document.activeElement?.dataset.routeId;
    const focusedPage = document.activeElement?.dataset.page;
    renderCatalog();
    if (focusedRoute) list.querySelector(`[data-route-id="${CSS.escape(focusedRoute)}"]`)?.focus({ preventScroll: true });
    else if (focusedPage) pagination.querySelector('[aria-current="page"]')?.focus({ preventScroll: true });
  }

  function renderCatalog() {
    const matching = filteredRoutes();
    const pages = Math.max(1, Math.ceil(matching.length / pageSize));
    currentPage = Math.min(currentPage, pages);
    const start = (currentPage - 1) * pageSize;
    const visible = matching.slice(start, start + pageSize);
    if (!visible.some(route => route.id === selectedId)) selectedId = visible[0]?.id ?? null;
    list.innerHTML = visible.map(route => `<button type="button" class="route-card${route.id === selectedId ? " is-selected" : ""}" data-route-id="${escapeHtml(route.id)}" aria-pressed="${route.id === selectedId}" aria-controls="route-detail-content" aria-label="Ver ruta ${escapeHtml(route.name)}">
      <span class="route-card-top"><span class="route-code">${escapeHtml(route.code)}</span><span class="route-category">${escapeHtml(route.category)}</span>${statusPill(route)}</span>
      <span class="route-card-name" title="${escapeHtml(route.name)}">${escapeHtml(route.name)}</span>
      <span class="route-corridor"><span title="${escapeHtml(route.origin.name)}">${escapeHtml(route.origin.name)}</span><span class="corridor-line" aria-hidden="true"></span><span title="${escapeHtml(route.destination.name)}">${escapeHtml(route.destination.name)}</span></span>
      <span class="route-card-meta"><span>${icon("time-icon")}${route.duration} min</span><span>${icon("location-icon")}${formatDistance(route.distance)} km</span><span>${route.stops.length ? `${route.stops.length} ${route.stops.length === 1 ? "parada" : "paradas"}` : "Directa"}</span><span class="selection-arrow" aria-hidden="true">↗</span></span>
    </button>`).join("");
    list.hidden = !matching.length;
    byId("catalog-empty").hidden = Boolean(matching.length);
    byId("empty-description").textContent = routes.length ? "Prueba con otra búsqueda o cambia el filtro." : "Crea tu primera ruta para empezar a organizar tus recorridos.";
    byId("clear-filters").hidden = !routes.length;
    byId("results-summary").textContent = matching.length ? `${start + 1}–${start + visible.length} de ${matching.length} rutas` : "0 rutas";
    renderPagination(pages);
    byId("total-routes").textContent = routes.length;
    byId("active-routes").textContent = routes.filter(route => route.status === "Activa").length;
    byId("inactive-routes").textContent = routes.filter(route => route.status === "Inactiva").length;
    renderDetail();
  }

  function schematic(route) {
    const positions = Array.from({ length: route.stops.length + 2 }, (_, index) => 32 + index * (296 / (route.stops.length + 1)));
    return `<div class="route-schematic"><div class="schematic-heading"><span>${icon("map-icon")}Esquema del recorrido</span><span>Sin escala</span></div>
      <svg viewBox="0 0 360 90" role="img" aria-label="Recorrido desde el origen hasta el destino con ${route.stops.length} paradas intermedias">
        <path d="M32 45 H328" fill="none" stroke="rgba(169, 188, 229, .14)" stroke-width="12" stroke-linecap="round"/>
        <path d="M32 45 H328" fill="none" stroke="#a9bcf6" stroke-width="2" stroke-dasharray="5 5"/>
        ${positions.map((x, index) => `<circle cx="${x}" cy="45" r="${index === 0 || index === positions.length - 1 ? 13 : 10}" fill="#101a33" stroke="${index === positions.length - 1 ? "#57c879" : "#a9bcf6"}" stroke-width="2"/><text x="${x}" y="49" text-anchor="middle" fill="${index === positions.length - 1 ? "#57c879" : "#f2f3f7"}" font-size="10" font-family="Inclusive Sans, sans-serif">${index === 0 ? "A" : index === positions.length - 1 ? "B" : index}</text>`).join("")}
      </svg><div class="schematic-labels"><span>Origen</span><span>${escapeHtml(route.direction)}</span><span>Destino</span></div></div>`;
  }

  function renderDetail() {
    const route = routes.find(item => item.id === selectedId);
    byId("detail-actions").hidden = !route;
    if (!route) {
      detail.innerHTML = `<div class="detail-placeholder"><span class="empty-icon">${icon("map-icon")}</span><h2>Tu próximo recorrido</h2><p>${routes.length ? "Selecciona una ruta del catálogo para consultar su itinerario." : "Añade una ruta para ver aquí su itinerario y sus características."}</p></div>`;
      return;
    }
    const points = [route.origin, ...route.stops, route.destination];
    detail.innerHTML = `<div class="detail-title-row"><span class="route-code">${escapeHtml(route.code)}</span>${statusPill(route)}</div>
      <h2>${escapeHtml(route.name)}</h2><p class="detail-category">${escapeHtml(route.category)} · ${escapeHtml(route.direction)}</p>
      ${schematic(route)}
      <div class="route-estimates"><div><strong>${formatDistance(route.distance)} <small>km</small></strong><span>Distancia estimada</span></div><div><strong>${route.duration} <small>min</small></strong><span>Duración estimada</span></div><div><strong>${route.stops.length}</strong><span>Paradas intermedias</span></div></div>
      <h3 class="section-label">Itinerario<span>Tramo de ida</span></h3>
      <ol class="itinerary">${points.map((point, index) => {
        const last = index === points.length - 1;
        return `<li class="${last ? "destination" : index ? "intermediate" : "origin"}"><span class="stop-marker" aria-hidden="true">${last ? "B" : index || "A"}</span><div class="itinerary-copy"><span>${last ? "DESTINO" : index ? `PARADA ${index}` : "ORIGEN"}</span><strong>${escapeHtml(point.name)}</strong><p>${escapeHtml(point.address)}</p></div></li>`;
      }).join("")}</ol>
      ${route.notes ? `<section class="route-notes"><h3>Indicaciones para el equipo</h3><p>${escapeHtml(route.notes)}</p></section>` : ""}`;
  }

  function selectRoute(id) {
    if (!routes.some(route => route.id === id)) return;
    selectedId = id;
    list.querySelectorAll("[data-route-id]").forEach(button => {
      const selected = button.dataset.routeId === id;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    renderDetail();
    detail.scrollTop = 0;
    if (window.matchMedia("(max-width: 770px)").matches) {
      document.querySelector(".route-detail").scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
      const heading = detail.querySelector("h2");
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }

  function resetFilters() {
    search.value = "";
    activeFilter = "Todas";
    currentPage = 1;
    filters.forEach(button => {
      const active = button.dataset.filter === activeFilter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function renderStops() {
    stopEditor.innerHTML = draftStops.map((stop, index) => `<div class="stop-editor-row" data-stop-index="${index}">
      <div class="stop-editor-heading"><span>PARADA ${index + 1}</span><div class="stop-editor-actions">
        <button type="button" class="icon-button" data-stop-action="up" aria-label="Subir parada ${index + 1}" ${index === 0 ? "disabled" : ""}>↑</button>
        <button type="button" class="icon-button" data-stop-action="down" aria-label="Bajar parada ${index + 1}" ${index === draftStops.length - 1 ? "disabled" : ""}>↓</button>
        <button type="button" class="icon-button" data-stop-action="remove" aria-label="Quitar parada ${index + 1}">${icon("trash-icon")}</button>
      </div></div>
      <div class="form-grid"><label>Punto de parada<input type="text" data-stop-field="name" value="${escapeHtml(stop.name)}" placeholder="Institución o punto de encuentro" maxlength="100" required></label><label>Dirección de la parada<input type="text" data-stop-field="address" value="${escapeHtml(stop.address)}" placeholder="Calle y número" maxlength="160" required></label></div>
    </div>`).join("");
    byId("add-stop").disabled = draftStops.length >= 6;
    byId("stop-limit").textContent = `${draftStops.length} / 6`;
  }

  function openForm(id = null) {
    const route = id ? routes.find(item => item.id === id) : null;
    if (id && !route) return;
    dialogTrigger = document.activeElement;
    editingId = route?.id ?? null;
    form.reset();
    formError.hidden = true;
    formError.textContent = "";
    byId("form-title").textContent = route ? "Editar ruta" : "Nueva ruta";
    byId("form-description").textContent = route ? `Actualiza el recorrido ${route.code} y sus características.` : "Define un recorrido para reutilizarlo en tus traslados.";
    byId("save-label").textContent = route ? "Guardar cambios" : "Guardar ruta";
    if (route) {
      const values = { name: route.name, category: route.category, direction: route.direction, status: route.status, originName: route.origin.name, originAddress: route.origin.address, destinationName: route.destination.name, destinationAddress: route.destination.address, distance: route.distance, duration: route.duration, notes: route.notes };
      Object.entries(values).forEach(([name, value]) => { form.elements.namedItem(name).value = value; });
    }
    draftStops = structuredClone(route?.stops ?? []);
    renderStops();
    formDialog.showModal();
    document.querySelector(".form-scroll").scrollTop = 0;
    byId("route-name").focus();
  }

  function restoreDialogFocus() {
    if (dialogTrigger?.isConnected) dialogTrigger.focus({ preventScroll: true });
    else byId("new-route").focus({ preventScroll: true });
  }

  function showError(message, target) {
    formError.textContent = message;
    formError.hidden = false;
    target?.focus();
  }

  search.addEventListener("input", () => { currentPage = 1; renderCatalog(); detail.scrollTop = 0; });
  sort.addEventListener("change", () => { currentPage = 1; renderCatalog(); detail.scrollTop = 0; });
  filters.forEach(button => button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    currentPage = 1;
    filters.forEach(item => { item.classList.toggle("is-active", item === button); item.setAttribute("aria-pressed", String(item === button)); });
    renderCatalog();
    detail.scrollTop = 0;
  }));
  byId("clear-filters").addEventListener("click", () => { resetFilters(); renderCatalog(); search.focus(); });
  pagination.addEventListener("click", event => {
    const button = event.target.closest("[data-page]");
    if (!button || button.disabled) return;
    const nextPage = Number(button.dataset.page);
    if (nextPage === currentPage) return;
    currentPage = nextPage;
    renderCatalog();
    detail.scrollTop = 0;
    pagination.querySelector('[aria-current="page"]')?.focus({ preventScroll: true });
  });
  list.addEventListener("click", event => {
    const button = event.target.closest("[data-route-id]");
    if (button) selectRoute(button.dataset.routeId);
  });
  byId("new-route").addEventListener("click", () => openForm());
  byId("edit-route").addEventListener("click", () => openForm(selectedId));
  document.querySelectorAll("[data-close-form]").forEach(button => button.addEventListener("click", () => formDialog.close()));
  formDialog.addEventListener("close", () => { editingId = null; restoreDialogFocus(); });
  form.addEventListener("input", () => { formError.hidden = true; });

  byId("add-stop").addEventListener("click", () => {
    if (draftStops.length >= 6) return;
    draftStops.push({ name: "", address: "" });
    renderStops();
    stopEditor.lastElementChild.querySelector("input").focus();
  });
  stopEditor.addEventListener("input", event => {
    const field = event.target.dataset.stopField;
    if (!field) return;
    const index = Number(event.target.closest("[data-stop-index]").dataset.stopIndex);
    draftStops[index][field] = event.target.value;
  });
  stopEditor.addEventListener("click", event => {
    const button = event.target.closest("[data-stop-action]");
    if (!button || button.disabled) return;
    const index = Number(button.closest("[data-stop-index]").dataset.stopIndex);
    const action = button.dataset.stopAction;
    let focusIndex = index;
    if (action === "remove") draftStops.splice(index, 1);
    else {
      const target = index + (action === "up" ? -1 : 1);
      [draftStops[index], draftStops[target]] = [draftStops[target], draftStops[index]];
      focusIndex = target;
    }
    renderStops();
    const row = stopEditor.children[Math.min(focusIndex, draftStops.length - 1)];
    (row?.querySelector("input") || byId("add-stop")).focus();
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const field = name => String(data.get(name) ?? "").trim();
    const requiredFields = ["name", "originName", "originAddress", "destinationName", "destinationAddress"];
    const blankField = requiredFields.find(name => !field(name));
    if (blankField) { showError("Completa los campos obligatorios con un nombre o dirección válidos.", form.elements.namedItem(blankField)); return; }
    if (routes.some(route => route.id !== editingId && normalize(route.name) === normalize(field("name")))) {
      showError("Ya existe una ruta con ese nombre. Elige un nombre diferente.", byId("route-name"));
      return;
    }
    const stops = draftStops.map(stop => ({ name: stop.name.trim(), address: stop.address.trim() }));
    const blankStop = stops.findIndex(stop => !validPlace(stop));
    if (blankStop >= 0) {
      showError("Completa el nombre y la dirección de cada parada o quítala del recorrido.", stopEditor.children[blankStop].querySelector("input"));
      return;
    }
    const origin = { name: field("originName"), address: field("originAddress") };
    const destination = { name: field("destinationName"), address: field("destinationAddress") };
    const samePlace = (a, b) => normalize(a.name) === normalize(b.name) && normalize(a.address) === normalize(b.address);
    if (samePlace(origin, destination)) { showError("El origen y el destino deben ser diferentes.", byId("route-destination")); return; }
    const points = [origin, ...stops, destination];
    if (points.some((point, index) => index > 0 && samePlace(point, points[index - 1]))) {
      showError("Dos puntos consecutivos del itinerario no pueden ser iguales.", byId("route-origin"));
      return;
    }
    const previous = routes.find(route => route.id === editingId);
    const route = {
      id: previous?.id ?? `route-${crypto.randomUUID()}`,
      code: previous?.code ?? `RT-${String(nextNumber).padStart(3, "0")}`,
      name: field("name"), category: field("category"), direction: field("direction"), status: field("status"), origin, destination, stops,
      distance: Number(field("distance")), duration: Number(field("duration")), notes: field("notes")
    };
    if (!validRoute(route)) { showError("Revisa los datos y las estimaciones del recorrido."); return; }
    if (previous) routes = routes.map(item => item.id === previous.id ? route : item);
    else { routes.push(route); nextNumber++; }
    const saved = persist();
    resetFilters();
    selectedId = route.id;
    currentPage = Math.floor(filteredRoutes().findIndex(item => item.id === route.id) / pageSize) + 1;
    renderCatalog();
    detail.scrollTop = 0;
    formDialog.close();
    notify(`${previous ? "Cambios guardados." : "Ruta creada."}${saved ? "" : " Los cambios se conservarán solo en esta pestaña."}`);
  });

  byId("delete-route").addEventListener("click", () => {
    const route = routes.find(item => item.id === selectedId);
    if (!route) return;
    dialogTrigger = document.activeElement;
    pendingDeleteId = route.id;
    byId("delete-description").textContent = `${route.code} · ${route.name}`;
    deleteDialog.showModal();
  });
  document.querySelectorAll("[data-close-delete]").forEach(button => button.addEventListener("click", () => deleteDialog.close()));
  deleteDialog.addEventListener("close", () => { pendingDeleteId = null; restoreDialogFocus(); });
  byId("confirm-delete").addEventListener("click", () => {
    if (!routes.some(route => route.id === pendingDeleteId)) { deleteDialog.close(); return; }
    routes = routes.filter(route => route.id !== pendingDeleteId);
    selectedId = null;
    const saved = persist();
    renderCatalog();
    detail.scrollTop = 0;
    dialogTrigger = list.querySelector("[data-route-id]") || byId("new-route");
    deleteDialog.close();
    notify(`Ruta eliminada.${saved ? "" : " Los cambios se conservarán solo en esta pestaña."}`);
  });

  [formDialog, deleteDialog].forEach(dialog => dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  }));

  renderCatalog();
  fitCatalogPage();
  const catalogObserver = new ResizeObserver(fitCatalogPage);
  catalogObserver.observe(list);
})();
