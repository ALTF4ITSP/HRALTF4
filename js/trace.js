// Traslados de ambulancias (trace.html): planilla por estado, formulario "Nuevo traslado" y mapa con Leaflet.
// Los datos se leen y guardan con php/traslados.php.
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const formulario = document.getElementById("formulario");
  const planilla = document.getElementById("planilla");
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
      planilla.innerHTML = `<tr><td colspan="8" class="traslados-vacio">${escapeHtml(datos.error?.message || "Error al cargar.")}</td></tr>`;
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
    opciones(f.id_origen, datos.destinos, lugar, "Elegí");
    opciones(f.id_destino, datos.destinos, lugar, "Elegí");
    f.id_destino.insertAdjacentHTML("beforeend", '<option value="otra">Otra dirección (una casa)…</option>');
    opciones(f.id_ambulancia, datos.ambulancias, a => `${a.matricula} · ${a.modelo}`, "Elegí");
    opciones(f.id_chofer, datos.personal.filter(p => p.rol === "Chofer"), p => p.nombre, "Elegí");
    opciones(f.id_acompanante, datos.personal.filter(p => p.rol === "Acompañante"), p => p.nombre, "Ninguno");

    const rutas = document.getElementById("ruta");
    rutas.innerHTML = '<option value="">Ninguna (elegir origen y destino)</option>' +
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

  // ¿En Destino se eligió "Otra dirección"?
  const esDireccion = () => formulario.elements.id_destino.value === "otra";

  // Destino elegido: uno de la lista o la dirección escrita (con la ubicación marcada)
  function destinoElegido() {
    const f = formulario.elements;
    if (!esDireccion()) return destinoPorId(f.id_destino.value);
    return f.destino_lat.value ? { nombre: f.destino_direccion.value || "Dirección marcada", lat: f.destino_lat.value, lng: f.destino_lng.value } : null;
  }

  // Al elegir origen o destino se marcan en el mapa
  function previsualizar() {
    const origen = destinoPorId(formulario.elements.id_origen.value);
    const destino = destinoElegido();
    if (origen && destino) dibujar(origen, destino, `Nuevo traslado: ${origen.nombre} → ${destino.nombre}`);
    else dibujo.clearLayers();
  }
  formulario.elements.id_origen.addEventListener("change", previsualizar);

  // Mostrar u ocultar el campo de la dirección
  function mostrarDireccion() {
    document.getElementById("cajaDireccion").hidden = !esDireccion();
    formulario.elements.destino_direccion.required = esDireccion();
    previsualizar();
  }
  formulario.elements.id_destino.addEventListener("change", mostrarDireccion);

  // Guarda la ubicación de la dirección y la muestra en el mapa
  function marcarDireccion(lat, lng, texto) {
    formulario.elements.destino_lat.value = lat;
    formulario.elements.destino_lng.value = lng;
    document.getElementById("ayudaDireccion").textContent = texto;
    previsualizar();
    if (!formulario.elements.id_origen.value) {   // sin origen todavía: solo el punto
      dibujo.clearLayers();
      L.circleMarker([lat, lng], { radius: 8, color: "#ff6b6b" }).addTo(dibujo);
      mapa.setView([lat, lng], 15);
    }
  }

  // Buscar la dirección con Nominatim (el buscador gratuito de OpenStreetMap, solo en Uruguay)
  document.getElementById("buscarDireccion").addEventListener("click", async () => {
    const direccion = formulario.elements.destino_direccion.value.trim();
    if (!direccion) return;
    const ayuda = document.getElementById("ayudaDireccion");
    ayuda.textContent = "Buscando...";
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=uy&limit=1&q=${encodeURIComponent(direccion)}`;
      const [lugar] = await (await fetch(url)).json();
      if (!lugar) {
        ayuda.textContent = "No se encontró. Probá agregando la ciudad, o hacé clic en el mapa.";
        return;
      }
      marcarDireccion(Number(lugar.lat), Number(lugar.lon), "Encontrada. Si no es el lugar exacto, hacé clic en el mapa.");
    } catch {
      ayuda.textContent = "No se pudo buscar (¿hay internet?). Hacé clic en el mapa para marcarla.";
    }
  });

  // Con "Otra dirección" elegida, un clic en el mapa marca la casa
  mapa.on("click", evento => {
    if (esDireccion()) marcarDireccion(evento.latlng.lat, evento.latlng.lng, "Ubicación marcada en el mapa.");
  });

  // "Lleva": si es un paciente se busca el paciente; si no, se escribe qué se lleva
  function mostrarCarga() {
    const esPaciente = formulario.elements.tipo_carga.value === "Paciente";
    document.getElementById("cajaPaciente").hidden = !esPaciente;
    document.getElementById("cajaCarga").hidden = esPaciente;
    formulario.elements.carga.required = !esPaciente;
  }
  formulario.elements.tipo_carga.addEventListener("change", mostrarCarga);

  // Una ruta habitual completa origen, destino y la llegada estimada (salida + duración)
  document.getElementById("ruta").addEventListener("change", evento => {
    const ruta = datos.rutas[evento.target.value];
    if (!ruta) return;
    const porCodigo = codigo => datos.destinos.find(d => d.codigo === codigo)?.id ?? "";
    formulario.elements.id_origen.value = porCodigo(ruta.origen);
    formulario.elements.id_destino.value = porCodigo(ruta.destino);
    // Si el origen o el destino de la ruta está Inactivo en Gestión → Destinos, no aparece en la lista
    document.getElementById("error").textContent = porCodigo(ruta.origen) && porCodigo(ruta.destino)
      ? "" : "Esa ruta usa un destino inactivo. Activalo en Gestión → Destinos.";
    document.getElementById("cajaDireccion").hidden = true;
    formulario.elements.destino_direccion.required = false;
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
    if (traslado.tipo_carga === "Paciente" && !traslado.id_gestion_paciente) {
      error.textContent = "Elegí el paciente.";
      return;
    }
    if (esDireccion() && !traslado.destino_lat) {
      error.textContent = "Buscá la dirección o hacé clic en el mapa para marcarla.";
      return;
    }

    const respuesta = await enviar({ accion: "nuevo", traslado });
    if (!respuesta.success) {
      error.textContent = respuesta.error?.message || "No se pudo guardar.";
      return;
    }
    formulario.reset();
    formulario.elements.destino_lat.value = formulario.elements.destino_lng.value = "";
    document.getElementById("ayudaDireccion").textContent = "Buscala o hacé clic en el mapa.";
    mostrarDireccion();
    mostrarCarga();
    buscadorPaciente.setValue(null);
    await cargar();
    mostrarTraslado(respuesta.id);
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

  // ---------- Planilla: un botón por estado ----------
  // Qué estados entran en cada botón de arriba
  const GRUPOS = {
    enCurso: ["EN_CAMINO", "EN_DESTINO", "RETORNANDO"],
    programados: ["PROGRAMADO"],
    finalizados: ["FINALIZADO"],
    cancelados: ["CANCELADO"]
  };
  let grupo = "enCurso";   // el botón elegido

  function mostrarLista() {
    const busqueda = document.getElementById("buscar").value.trim().toLowerCase();
    const buscados = datos.traslados.filter(t =>
      [t.id, t.matricula, t.chofer, t.acompanante, t.paciente, t.carga, t.origen, t.destino]
        .join(" ").toLowerCase().includes(busqueda));

    // Cantidad en cada botón
    document.querySelectorAll(".pestana").forEach(boton => {
      const cantidad = buscados.filter(t => GRUPOS[boton.dataset.grupo].includes(t.estado)).length;
      boton.querySelector("span").textContent = `(${cantidad})`;
      boton.classList.toggle("activa", boton.dataset.grupo === grupo);
    });

    const visibles = buscados.filter(t => GRUPOS[grupo].includes(t.estado));
    planilla.innerHTML = visibles.length ? visibles.map(t => `
      <tr data-id="${t.id}">
        <td>${t.id}</td>
        <td><span class="estado estado-${t.estado}">${ESTADOS[t.estado].nombre}</span></td>
        <td>${escapeHtml(t.matricula)}</td>
        <td>${escapeHtml(t.tipo_carga === "Paciente" ? t.paciente : `${t.tipo_carga}: ${t.carga}`)}</td>
        <td>${escapeHtml(t.origen)} → ${escapeHtml(t.destino)}</td>
        <td>${hora(t.salida_real || t.salida_programada)}</td>
        <td>${hora(t.retorno_real || t.llegada_real || t.llegada_estimada)}</td>
        <td class="traslados-celda-botones">${ESTADOS[t.estado].boton ? `
          <button type="button" class="traslados-boton" data-avanzar="${t.id}">${ESTADOS[t.estado].boton}</button>
          <button type="button" class="traslados-boton secundario" data-cancelar="${t.id}">Cancelar</button>` : ""}
        </td>
      </tr>`).join("")
      : '<tr><td colspan="8" class="traslados-vacio">No hay traslados en este grupo.</td></tr>';
  }

  function verEnMapa(id) {
    const t = datos.traslados.find(t => String(t.id) === String(id));
    if (!t) return;
    planilla.querySelectorAll("tr").forEach(fila => fila.classList.toggle("elegido", fila.dataset.id === String(id)));
    dibujar({ nombre: t.origen, lat: t.origen_lat, lng: t.origen_lng },
      { nombre: t.destino, lat: t.destino_lat, lng: t.destino_lng },
      `Traslado ${t.id}: ${t.origen} → ${t.destino} (${ESTADOS[t.estado].nombre})`);
  }

  // Al guardar uno nuevo se muestra su grupo (Programados) y se marca en el mapa
  function mostrarTraslado(id) {
    const t = datos.traslados.find(t => String(t.id) === String(id));
    if (t) grupo = Object.keys(GRUPOS).find(g => GRUPOS[g].includes(t.estado));
    mostrarLista();
    verEnMapa(id);
  }

  document.getElementById("buscar").addEventListener("input", mostrarLista);

  document.querySelector(".traslados-pestanas").addEventListener("click", evento => {
    const boton = evento.target.closest(".pestana");
    if (!boton) return;
    grupo = boton.dataset.grupo;
    mostrarLista();
  });

  planilla.addEventListener("click", async evento => {
    const { avanzar, cancelar } = evento.target.dataset;
    if (avanzar || cancelar) {
      if (cancelar && !confirm(`¿Cancelar el traslado ${cancelar}?`)) return;
      const respuesta = await enviar({ accion: avanzar ? "avanzar" : "cancelar", id: Number(avanzar || cancelar) });
      if (!respuesta.success) alert(respuesta.error?.message || "No se pudo cambiar el estado.");
      await cargar();
      return;
    }
    const fila = evento.target.closest("tr[data-id]");
    if (fila) verEnMapa(fila.dataset.id);
  });

  cargar();
});
