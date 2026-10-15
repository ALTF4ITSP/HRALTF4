// Mapa de traslados (trace-map.html). Usa Leaflet y los datos de php/traslados.php y php/gestion.php
document.addEventListener("DOMContentLoaded", async () => {
  "use strict";
  const COLORES = { ASIGNADO: "#7d95ec", EN_CURSO: "#4cc878", EN_DESTINO: "#f0a040" };
  const ESTADOS = { ASIGNADO: "Asignado", EN_CURSO: "En curso", EN_DESTINO: "En destino" };
  const MONTEVIDEO = [-34.8833, -56.1667];

  const list = document.getElementById("transferList");
  const message = document.getElementById("mapMessage");

  // 1. Mapa base (OpenStreetMap)
  const map = L.map("transferMap").setView(MONTEVIDEO, 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);

  function escapeHtml(value) {
    const element = document.createElement("span");
    element.textContent = value ?? "";
    return element.innerHTML;
  }

  async function getJson(url) {
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    const data = await response.json();
    if (!response.ok || data.success !== true) throw new Error(data?.error?.message);
    return data.data;
  }

  // Dónde está la ambulancia: en el origen antes de salir, en el destino al llegar,
  // y en el medio, según el tiempo que pasó desde la salida
  function ambulancePosition(t, from, to) {
    if (t.estado === "ASIGNADO") return from;
    if (t.estado === "EN_DESTINO" || !t.llegada_estimada) return to;
    const start = new Date(t.fecha_salida), end = new Date(t.llegada_estimada);
    const progress = Math.min(Math.max((Date.now() - start) / (end - start), 0), 1);
    return [from[0] + (to[0] - from[0]) * progress, from[1] + (to[1] - from[1]) * progress];
  }

  function hora(valor) {
    return valor ? valor.split("T")[1] : "—";
  }

  try {
    const [traslados, destinos] = await Promise.all([
      getJson("../php/traslados.php"),
      getJson("../php/gestion.php?modulo=destinos")
    ]);

    // 2. Destinos como puntos grises
    destinos.filter(d => d.lat !== null && d.lng !== null).forEach(d => {
      L.circleMarker([d.lat, d.lng], { radius: 5, color: "#abbaea", weight: 2, fillOpacity: 0.6 })
        .bindTooltip(d.name)
        .addTo(map);
    });

    // 3. Una línea por traslado activo (si su origen y destino tienen coordenadas)
    const activos = traslados.filter(t => COLORES[t.estado]);
    const capas = {};
    const sinUbicacion = [];

    activos.forEach(t => {
      if ([t.origen_lat, t.origen_lng, t.destino_lat, t.destino_lng].some(v => v === null)) {
        sinUbicacion.push(t.id);
        return;
      }
      const from = [+t.origen_lat, +t.origen_lng];
      const to = [+t.destino_lat, +t.destino_lng];
      const color = COLORES[t.estado];
      const popup = `<strong>Traslado ${t.id}</strong> · ${ESTADOS[t.estado]}<br>` +
        `${escapeHtml(t.origen)} → ${escapeHtml(t.destino)}<br>` +
        `Ambulancia ${escapeHtml(t.matricula)} · ${escapeHtml(t.chofer)}<br>` +
        `Salida ${hora(t.fecha_salida)} · Llegada ${hora(t.llegada_estimada)}<br>` +
        `<a href="trace-view.html?id=${t.id}">Ver detalles</a>`;

      const line = L.polyline([from, to], { color, weight: 4, opacity: 0.9, dashArray: t.estado === "ASIGNADO" ? "8 8" : null })
        .bindPopup(popup);
      const icon = L.divIcon({
        className: "ambulance-marker",
        html: `<span style="--color: ${color}"><img src="../imagenes/ambulance-icon.png" alt=""></span>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      const marker = L.marker(ambulancePosition(t, from, to), { icon, title: `Traslado ${t.id}` }).bindPopup(popup);
      capas[t.id] = L.featureGroup([line, marker]).addTo(map);
    });

    // 4. Lista de traslados activos
    document.getElementById("activeCount").textContent = activos.length;
    list.innerHTML = activos.length ? activos.map(t => `
      <li>
        <button type="button" class="map-item" data-id="${t.id}" style="--color: ${COLORES[t.estado]}">
          <strong>Traslado ${t.id} <small>${ESTADOS[t.estado].toUpperCase()}</small></strong>
          <p>${escapeHtml(t.origen)} → ${escapeHtml(t.destino)}</p>
          <p>Ambulancia ${escapeHtml(t.matricula)} · salida ${hora(t.fecha_salida)}</p>
        </button>
      </li>`).join("") : '<li class="map-empty">No hay traslados activos.</li>';

    list.addEventListener("click", event => {
      const button = event.target.closest(".map-item");
      if (!button) return;
      list.querySelectorAll(".map-item").forEach(item => item.classList.toggle("is-selected", item === button));
      const capa = capas[button.dataset.id];
      if (!capa) {
        message.textContent = `El traslado ${button.dataset.id} no tiene coordenadas en su origen o destino.`;
        message.hidden = false;
        return;
      }
      map.fitBounds(capa.getBounds(), { padding: [60, 60] });
      capa.getLayers()[1].openPopup();
    });

    // 5. Encuadrar todos los recorridos
    const todas = Object.values(capas);
    if (todas.length) map.fitBounds(L.featureGroup(todas).getBounds(), { padding: [40, 40] });

    if (sinUbicacion.length) {
      message.textContent = `Sin ubicación en el mapa: traslado ${sinUbicacion.join(", ")} (su origen o destino no tiene coordenadas).`;
      message.hidden = false;
    }
  } catch (error) {
    message.textContent = error.message || "No se pudieron cargar los traslados.";
    message.hidden = false;
  }
});
