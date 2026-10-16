// Traslados de ambulancias (trace.html): formulario "Nuevo traslado", lista y mapa con Leaflet.
// Los datos se leen y guardan con php/traslados.php.
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const formulario = document.getElementById("formulario");
  const listaHtml = document.getElementById("lista");
  let datos = {};   // lo que devuelve traslados.php: traslados, ambulancias, personal, destinos, pacientes, rutas

  // Nombre de cada estado y texto del botón para pasar al siguiente
  const ESTADOS = {
    PROGRAMADO: { nombre: "Programado", boton: "Salió" },
    EN_CAMINO: { nombre: "En camino", boton: "Llegó al destino" },
    EN_DESTINO: { nombre: "En destino", boton: "Emprende el regreso" },
    RETORNANDO: { nombre: "Retornando", boton: "Volvió al hospital" },
    FINALIZADO: { nombre: "Finalizado" },
    CANCELADO: { nombre: "Cancelado" }
  };

  const escapeHtml = valor => {
    const span = document.createElement("span");
    span.textContent = valor ?? "";
    return span.innerHTML;
  };

  // "2026-10-16 08:05" → "16/10 08:05"
  const hora = fecha => fecha ? `${fecha.slice(8, 10)}/${fecha.slice(5, 7)} ${fecha.slice(11)}` : "—";

  // ---------- Mapa ----------
  const mapa = L.map("mapa").setView([-32.8, -56], 7);   // todo Uruguay
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap" }).addTo(mapa);
  const dibujo = L.layerGroup().addTo(mapa);   // acá se dibuja el traslado elegido

  // Dibuja origen (verde), destino (rojo) y una línea entre los dos
  function dibujar(origen, destino, texto) {
    dibujo.clearLayers();
    if (!origen?.lat || !destino?.lat) return;
    const a = [Number(origen.lat), Number(origen.lng)];
    const b = [Number(destino.lat), Number(destino.lng)];
    L.circleMarker(a, { radius: 8, color: "#4ade80" }).bindTooltip(`Origen: ${escapeHtml(origen.nombre)}`).addTo(dibujo);
    L.circleMarker(b, { radius: 8, color: "#ff6b6b" }).bindTooltip(`Destino: ${escapeHtml(destino.nombre)}`).addTo(dibujo);
    L.polyline([a, b], { color: "#7d95ec", dashArray: "8 6" }).addTo(dibujo);
    mapa.fitBounds([a, b], { padding: [40, 40], maxZoom: 13 });
    document.getElementById("ayudaMapa").textContent = texto;
  }

  // ---------- Cargar datos ----------
  async function cargar() {
    const respuesta = await fetch("../php/traslados.php", { headers: { Accept: "application/json" } });
    datos = await respuesta.json();
    if (!datos.success) {
      listaHtml.innerHTML = `<li class="traslados-vacio">${escapeHtml(datos.error?.message || "Error al cargar.")}</li>`;
      return;
    }
    llenarFormulario();
    mostrarLista();
  }

  // Opciones de un <select>: lista de objetos → <option value="id">texto</option>
  function opciones(select, lista, texto, primera = null) {
    const valorActual = select.value;
    select.innerHTML = (primera ? `<option value="">${primera}</option>` : "") +
      lista.map(item => `<option value="${item.id}">${escapeHtml(texto(item))}</option>`).join("");
    select.value = valorActual;
  }

  let buscadorPaciente = null;
  function llenarFormulario() {
    const f = formulario.elements;
    const lugar = d => `${d.nombre} (${d.localidad})`;
    opciones(f.id_origen, datos.destinos, lugar, "Elegí el origen");
    opciones(f.id_destino, datos.destinos, lugar, "Elegí el destino");
    opciones(f.id_ambulancia, datos.ambulancias, a => `${a.matricula} · ${a.modelo}`, "Elegí la ambulancia");
    opciones(f.id_chofer, datos.personal.filter(p => p.rol === "Chofer"), p => p.nombre, "Elegí el conductor");
    opciones(f.id_acompanante, datos.personal.filter(p => p.rol === "Acompañante"), p => p.nombre, "Sin acompañante");

    const rutas = document.getElementById("ruta");
    rutas.innerHTML = '<option value="">Sin ruta</option>' +
      datos.rutas.map((r, i) => `<option value="${i}">${escapeHtml(`${r.numero} · ${r.nombre}`)}</option>`).join("");

    buscadorPaciente ??= crearBuscador(document.getElementById("paciente"), { texto: p => `${p.nombre} · CI ${p.documento}` });
    buscadorPaciente.setItems(datos.pacientes);

    if (!f.salida_programada.value) f.salida_programada.value = ahora();
  }

  // Fecha y hora actual para el campo datetime-local ("2026-10-16T09:30")
  function ahora(minutosMas = 0) {
    const fecha = new Date(Date.now() + minutosMas * 60000 - new Date().getTimezoneOffset() * 60000);
    return fecha.toISOString().slice(0, 16);
  }

  // ---------- Formulario ----------
  const destinoPorId = id => datos.destinos.find(d => String(d.id) === String(id));

  // Al elegir origen o destino se marcan en el mapa
  function previsualizar() {
    const origen = destinoPorId(formulario.elements.id_origen.value);
    const destino = destinoPorId(formulario.elements.id_destino.value);
    if (origen && destino) dibujar(origen, destino, `Nuevo traslado: ${origen.nombre} → ${destino.nombre}`);
  }
  formulario.elements.id_origen.addEventListener("change", previsualizar);
  formulario.elements.id_destino.addEventListener("change", previsualizar);

  // Una ruta habitual completa origen, destino y la llegada estimada (salida + duración)
  document.getElementById("ruta").addEventListener("change", evento => {
    const ruta = datos.rutas[evento.target.value];
    if (!ruta) return;
    const porCodigo = codigo => datos.destinos.find(d => d.codigo === codigo)?.id ?? "";
    formulario.elements.id_origen.value = porCodigo(ruta.origen);
    formulario.elements.id_destino.value = porCodigo(ruta.destino);
    const salida = formulario.elements.salida_programada.value;
    if (salida) {
      const minutos = (new Date(salida) - Date.now()) / 60000 + Number(ruta.duracion_min);
      formulario.elements.llegada_estimada.value = ahora(minutos);
    }
    previsualizar();
  });

  formulario.addEventListener("submit", async evento => {
    evento.preventDefault();
    const traslado = Object.fromEntries(new FormData(formulario));
    const error = document.getElementById("error");
    error.textContent = "";
    if (!traslado.id_gestion_paciente && !traslado.elemento.trim()) {
      error.textContent = "Elegí un paciente o escribí qué se traslada.";
      return;
    }

    const respuesta = await enviar({ accion: "nuevo", traslado });
    if (!respuesta.success) {
      error.textContent = respuesta.error?.message || "No se pudo guardar.";
      return;
    }
    formulario.reset();
    buscadorPaciente.setValue(null);
    await cargar();
    verEnMapa(respuesta.id);
  });

  async function enviar(cuerpo) {
    const respuesta = await fetch("../php/traslados.php", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(cuerpo)
    });
    return respuesta.json();
  }

  // ---------- Lista ----------
  function mostrarLista() {
    const busqueda = document.getElementById("buscar").value.trim().toLowerCase();
    const visibles = datos.traslados.filter(t =>
      [t.id, t.matricula, t.chofer, t.acompanante, t.paciente, t.elemento, t.origen, t.destino, ESTADOS[t.estado].nombre]
        .join(" ").toLowerCase().includes(busqueda));

    listaHtml.innerHTML = visibles.length ? visibles.map(t => `
      <li class="traslado" data-id="${t.id}">
        <div class="traslado-arriba">
          <strong>#${t.id} · ${escapeHtml(t.matricula)}</strong>
          <span class="estado estado-${t.estado}">${ESTADOS[t.estado].nombre}</span>
        </div>
        <p>${escapeHtml(t.paciente ? `Paciente: ${t.paciente}` : `Elemento: ${t.elemento}`)}</p>
        <p>${escapeHtml(t.origen)} → ${escapeHtml(t.destino)}</p>
        <p class="traslado-gris">Conductor: ${escapeHtml(t.chofer)}${t.acompanante ? ` · Acompañante: ${escapeHtml(t.acompanante)}` : ""}</p>
        <p class="traslado-gris">
          Salida: ${hora(t.salida_real || t.salida_programada)}${t.salida_real ? "" : " (programada)"} ·
          Llegada: ${hora(t.llegada_real || t.llegada_estimada)}${t.llegada_real ? "" : " (estimada)"}
          ${t.retorno_real ? ` · Regreso: ${hora(t.retorno_real)}` : ""}
        </p>
        ${ESTADOS[t.estado].boton ? `
          <div class="traslado-botones">
            <button type="button" class="traslados-boton" data-avanzar="${t.id}">${ESTADOS[t.estado].boton}</button>
            <button type="button" class="traslados-boton secundario" data-cancelar="${t.id}">Cancelar</button>
          </div>` : ""}
      </li>`).join("")
      : '<li class="traslados-vacio">No hay traslados para mostrar.</li>';
  }

  function verEnMapa(id) {
    const t = datos.traslados.find(t => String(t.id) === String(id));
    if (!t) return;
    listaHtml.querySelectorAll(".traslado").forEach(li => li.classList.toggle("elegido", li.dataset.id === String(id)));
    dibujar({ nombre: t.origen, lat: t.origen_lat, lng: t.origen_lng },
      { nombre: t.destino, lat: t.destino_lat, lng: t.destino_lng },
      `Traslado #${t.id}: ${t.origen} → ${t.destino} (${ESTADOS[t.estado].nombre})`);
  }

  document.getElementById("buscar").addEventListener("input", mostrarLista);

  listaHtml.addEventListener("click", async evento => {
    const { avanzar, cancelar } = evento.target.dataset;
    if (avanzar || cancelar) {
      if (cancelar && !confirm(`¿Cancelar el traslado #${cancelar}?`)) return;
      const respuesta = await enviar({ accion: avanzar ? "avanzar" : "cancelar", id: Number(avanzar || cancelar) });
      if (!respuesta.success) alert(respuesta.error?.message || "No se pudo cambiar el estado.");
      await cargar();
    }
    const li = evento.target.closest(".traslado");
    if (li) verEnMapa(li.dataset.id);
  });

  cargar();
});
