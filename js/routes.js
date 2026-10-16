// Rutas (routes.html): lista, detalle con mapa de Leaflet y formulario.
// Las rutas y los destinos se cargan y guardan con gestionApi (js/gestion-api.js → php/gestion.php).
document.addEventListener("DOMContentLoaded", async () => {
  "use strict";
  const $ = id => document.getElementById(id);
  const form = $("routeForm");
  const dialog = $("routeDialog");

  let routes = [];
  let places = {};       // destinos por código: { "seed-1": { name, lat, lng, ... } }
  let selectedId = null;
  let editingId = null;

  // ---------- Mapa (Leaflet) ----------
  const map = L.map("routeMap").setView([-34.8833, -56.1667], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);
  const layer = L.layerGroup().addTo(map);   // aquí se dibuja la ruta elegida

  // ---------- Ayudas ----------
  function escapeHtml(value) {
    const element = document.createElement("span");
    element.textContent = value ?? "";
    return element.innerHTML;
  }

  const placeName = code => places[code]?.name || "Destino borrado";

  // Los puntos de una ruta en orden: origen, paradas y destino
  const pointsOf = route => [route.origin, ...route.stops, route.destination];

  // Distancia en línea recta sumando cada tramo (fórmula de Haversine)
  function distanceKm(route) {
    const coords = pointsOf(route).map(code => places[code]).filter(p => p && p.lat !== null);
    let total = 0;
    for (let i = 1; i < coords.length; i++) {
      const rad = Math.PI / 180, a = coords[i - 1], b = coords[i];
      const h = Math.sin((b.lat - a.lat) * rad / 2) ** 2 +
        Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin((b.lng - a.lng) * rad / 2) ** 2;
      total += 6371 * 2 * Math.asin(Math.sqrt(h));
    }
    return total;
  }

  // ---------- Lista ----------
  function renderList() {
    const text = $("routeSearch").value.trim().toLowerCase();
    const status = $("routeStatus").value;
    const visible = routes.filter(route =>
      (!status || route.status === status) &&
      `${route.code} ${route.name} ${pointsOf(route).map(placeName).join(" ")}`.toLowerCase().includes(text));

    $("routeList").innerHTML = visible.length ? visible.map(route => `
      <li>
        <button type="button" class="route-item${route.id === selectedId ? " is-selected" : ""}" data-id="${route.id}">
          <strong>${route.code} · ${escapeHtml(route.name)}</strong>
          <span>${escapeHtml(placeName(route.origin))} → ${escapeHtml(placeName(route.destination))}</span>
          <small class="${route.status === "Activa" ? "is-active" : ""}">${route.status}</small>
        </button>
      </li>`).join("") : '<li class="route-muted">No hay rutas para mostrar.</li>';
  }

  // ---------- Detalle con mapa ----------
  function renderDetail() {
    const route = routes.find(item => item.id === selectedId);
    $("routeDetail").hidden = !route;
    $("routeEmpty").hidden = Boolean(route);
    if (!route) return;

    $("detailCode").textContent = route.code;
    $("detailStatus").textContent = route.status;
    $("detailName").textContent = route.name;
    $("detailCategory").textContent = `${route.category} · ${route.direction}`;
    $("detailDistance").textContent = `${distanceKm(route).toFixed(1).replace(".", ",")} km`;
    $("detailDuration").textContent = `${route.duration} min`;
    $("detailNotes").textContent = route.notes;

    const points = pointsOf(route);
    $("detailItinerary").innerHTML = points.map((code, i) =>
      `<li><strong>${i === 0 ? "Origen" : i === points.length - 1 ? "Destino" : `Parada ${i}`}:</strong> ${escapeHtml(placeName(code))}</li>`).join("");

    // Dibujar en el mapa: un punto por lugar y una línea uniéndolos
    layer.clearLayers();
    const coords = points.map(code => places[code]).filter(p => p && p.lat !== null).map(p => [p.lat, p.lng]);
    points.forEach((code, i) => {
      const place = places[code];
      if (!place || place.lat === null) return;
      L.circleMarker([place.lat, place.lng], { radius: 7, color: i === points.length - 1 ? "#4cc878" : "#7d95ec", fillOpacity: 0.9 })
        .bindTooltip(`${i === 0 ? "A" : i === points.length - 1 ? "B" : i} · ${place.name}`)
        .addTo(layer);
    });
    if (coords.length > 1) {
      L.polyline(coords, { color: "#7d95ec", weight: 4 }).addTo(layer);
      map.invalidateSize();   // el mapa estaba oculto: Leaflet tiene que recalcular su tamaño
      map.fitBounds(coords, { padding: [30, 30] });
    }
  }

  function select(id) {
    selectedId = id;
    renderList();
    renderDetail();
  }

  // ---------- Formulario ----------
  function placeOptions(selected) {
    return Object.entries(places).map(([code, place]) =>
      `<option value="${code}"${code === selected ? " selected" : ""}>${escapeHtml(place.name)}</option>`).join("");
  }

  function addStopSelect(code = "") {
    const row = document.createElement("div");
    row.className = "route-stop";
    row.innerHTML = `<select>${placeOptions(code)}</select><button type="button" aria-label="Quitar parada">×</button>`;
    row.querySelector("button").addEventListener("click", () => row.remove());
    $("stopList").append(row);
  }

  function openForm(route = null) {
    editingId = route?.id ?? null;
    $("routeDialogTitle").textContent = route ? `Editar ${route.code}` : "Nueva ruta";
    form.reset();
    form.elements.origin.innerHTML = placeOptions(route?.origin);
    form.elements.destination.innerHTML = placeOptions(route?.destination);
    $("stopList").innerHTML = "";
    if (route) {
      ["name", "category", "direction", "status", "duration", "notes"].forEach(key => { form.elements[key].value = route[key]; });
      route.stops.forEach(code => addStopSelect(code));
    }
    $("routeError").textContent = "";
    dialog.showModal();
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    const f = form.elements;
    const stops = [...$("stopList").querySelectorAll("select")].map(select => select.value);
    if (f.origin.value === f.destination.value && !stops.length) {
      $("routeError").textContent = "El origen y el destino no pueden ser el mismo lugar.";
      return;
    }

    const previous = routes.find(route => route.id === editingId);
    // Código nuevo: el número más alto + 1 (RT-007 → RT-008)
    const next = Math.max(0, ...routes.map(route => Number(route.code.slice(3)))) + 1;
    const route = {
      id: previous?.id ?? `ruta-${Date.now()}`,
      code: previous?.code ?? `RT-${String(next).padStart(3, "0")}`,
      name: f.name.value.trim(),
      category: f.category.value,
      direction: f.direction.value,
      status: f.status.value,
      origin: f.origin.value,
      destination: f.destination.value,
      stops,
      duration: Number(f.duration.value),
      notes: f.notes.value.trim()
    };

    routes = previous ? routes.map(item => item.id === route.id ? route : item) : [...routes, route];
    gestionApi.guardar("rutas", routes);
    dialog.close();
    select(route.id);
  });

  // ---------- Botones ----------
  $("newRoute").addEventListener("click", () => openForm());
  $("editRoute").addEventListener("click", () => openForm(routes.find(route => route.id === selectedId)));
  $("cancelRoute").addEventListener("click", () => dialog.close());
  $("addStop").addEventListener("click", () => addStopSelect());
  $("deleteRoute").addEventListener("click", () => {
    const route = routes.find(item => item.id === selectedId);
    if (!confirm(`¿Eliminar la ruta ${route.code} · ${route.name}?`)) return;
    routes = routes.filter(item => item.id !== selectedId);
    gestionApi.guardar("rutas", routes);
    select(null);
  });
  $("routeList").addEventListener("click", event => {
    const button = event.target.closest(".route-item");
    if (button) select(button.dataset.id);
  });
  $("routeSearch").addEventListener("input", renderList);
  $("routeStatus").addEventListener("change", renderList);

  // ---------- Inicio: cargar destinos y rutas ----------
  const [destinos, lista] = await Promise.all([gestionApi.cargar("destinos"), gestionApi.cargar("rutas")]);
  destinos.forEach(d => { places[d.id] = d; });
  routes = lista;
  select(routes[0]?.id ?? null);
});
