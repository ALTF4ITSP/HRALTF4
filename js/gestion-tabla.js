// Página de Gestión genérica: buscador + tabla + formulario para crear, editar y borrar.
// La usan Pacientes, Médicos, Personal, Ambulancias y Destinos. Cada página llama a
// crearPaginaGestion({...}) diciendo qué columnas muestra y qué campos tiene el formulario.
// Los datos se cargan y guardan con gestionApi (js/gestion-api.js → php/gestion.php).
//
// Ejemplo (js/patients.js):
//   crearPaginaGestion({
//     modulo: "pacientes", titulo: "Pacientes", singular: "paciente",
//     campos: [
//       { campo: "name", etiqueta: "Nombre", requerido: true, enTabla: true },
//       { campo: "age", etiqueta: "Edad", tipo: "number" }
//     ]
//   });
//
// Tipos de campo: "text" (por defecto), "number" y "select" (con opciones).
// Con mapa: true, el formulario muestra un mapa para marcar la ubicación (lat y lng).
function crearPaginaGestion(config) {
  document.addEventListener("DOMContentLoaded", async () => {
    "use strict";
    const pagina = document.getElementById("gestion");
    let lista = [];
    let editando = null;   // id del elemento que se está editando (null = nuevo)

    const escapeHtml = valor => {
      const span = document.createElement("span");
      span.textContent = valor ?? "";
      return span.innerHTML;
    };

    // Texto que se muestra para un valor (en los select puede ser distinto al valor guardado)
    function texto(campo, valor) {
      const opcion = (campo.opciones || []).find(o => (o.valor ?? o) === valor);
      return opcion?.texto ?? valor ?? "";
    }

    // ---------- Armar la página ----------
    const columnas = config.campos.filter(c => c.enTabla);
    const textoNuevo = config.nuevo || `Nuevo ${config.singular}`;   // Ambulancias usa "Nueva ambulancia"
    pagina.innerHTML = `
      <a href="management.html" class="gestion-volver">← Volver a Gestión</a>
      <div class="gestion-encabezado">
        <h1>${config.titulo}</h1>
        <button type="button" class="gestion-boton" id="nuevo">+ ${textoNuevo}</button>
      </div>
      <input type="search" class="gestion-buscar" id="buscar" placeholder="Buscar..." aria-label="Buscar">
      <table class="gestion-tabla">
        <thead><tr>${columnas.map(c => `<th>${c.etiqueta}</th>`).join("")}<th></th></tr></thead>
        <tbody id="filas"></tbody>
      </table>

      <dialog class="gestion-dialogo" id="dialogo">
        <form id="formulario">
          <h2 id="tituloFormulario"></h2>
          ${config.campos.map(c => `
            <label>${c.etiqueta}
              ${c.tipo === "select"
                ? `<select name="${c.campo}">${c.opciones.map(o => `<option value="${o.valor ?? o}">${o.texto ?? o}</option>`).join("")}</select>`
                : `<input name="${c.campo}" type="${c.tipo || "text"}" ${c.requerido ? "required" : ""}
                          ${c.min !== undefined ? `min="${c.min}"` : ""} ${c.max !== undefined ? `max="${c.max}"` : ""}
                          maxlength="${c.largo || 150}">`}
            </label>`).join("")}
          ${config.mapa ? `
            <p class="gestion-ayuda">Hacé clic en el mapa para marcar la ubicación.</p>
            <div id="mapaFormulario"></div>
            <p class="gestion-ayuda" id="coordenadas">Sin ubicación</p>` : ""}
          <div class="gestion-acciones">
            <button type="button" class="gestion-boton secundario" id="cancelar">Cancelar</button>
            <button type="submit" class="gestion-boton">Guardar</button>
          </div>
        </form>
      </dialog>`;

    const formulario = document.getElementById("formulario");
    const dialogo = document.getElementById("dialogo");

    // ---------- Tabla ----------
    function mostrarTabla() {
      const busqueda = document.getElementById("buscar").value.trim().toLowerCase();
      const visibles = lista.filter(item =>
        columnas.some(c => String(texto(c, item[c.campo])).toLowerCase().includes(busqueda)));

      document.getElementById("filas").innerHTML = visibles.length ? visibles.map(item => `
        <tr>
          ${columnas.map(c => `<td>${escapeHtml(texto(c, item[c.campo]))}</td>`).join("")}
          <td class="gestion-celda-botones">
            <button type="button" data-editar="${item.id}">Editar</button>
            <button type="button" data-borrar="${item.id}" class="borrar">Borrar</button>
          </td>
        </tr>`).join("")
        : `<tr><td colspan="${columnas.length + 1}" class="gestion-vacio">No hay datos para mostrar.</td></tr>`;
    }

    // ---------- Mapa del formulario (solo Destinos) ----------
    let mapa = null, marcador = null, ubicacion = null;
    function marcarUbicacion(lat, lng) {
      ubicacion = lat === null || lat === undefined ? null : { lat, lng };
      if (marcador) marcador.remove();
      marcador = ubicacion ? L.marker([lat, lng]).addTo(mapa) : null;
      document.getElementById("coordenadas").textContent = ubicacion
        ? `Ubicación: ${lat.toFixed(5)}, ${lng.toFixed(5)}` : "Sin ubicación";
    }
    if (config.mapa) {
      mapa = L.map("mapaFormulario").setView([-32.8, -56], 6);   // todo Uruguay
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap" }).addTo(mapa);
      mapa.on("click", evento => marcarUbicacion(evento.latlng.lat, evento.latlng.lng));
    }

    // ---------- Formulario ----------
    function abrirFormulario(item = null) {
      editando = item ? item.id : null;
      document.getElementById("tituloFormulario").textContent = item ? `Editar ${config.singular}` : textoNuevo;
      formulario.reset();
      if (item) config.campos.forEach(c => { formulario.elements[c.campo].value = item[c.campo] ?? ""; });
      dialogo.showModal();
      if (mapa) {
        mapa.invalidateSize();   // el mapa estaba oculto: Leaflet recalcula su tamaño
        marcarUbicacion(item?.lat ?? null, item?.lng ?? null);
        if (ubicacion) mapa.setView([ubicacion.lat, ubicacion.lng], 13);
      }
    }

    formulario.addEventListener("submit", evento => {
      evento.preventDefault();
      const anterior = lista.find(item => item.id === editando);
      const nuevo = { ...anterior, id: anterior?.id ?? config.nuevoId(lista) };
      config.campos.forEach(c => {
        const valor = formulario.elements[c.campo].value.trim();
        nuevo[c.campo] = c.tipo === "number" ? Number(valor) : valor;
      });
      if (config.mapa) {
        nuevo.lat = ubicacion?.lat ?? null;
        nuevo.lng = ubicacion?.lng ?? null;
      }

      lista = anterior ? lista.map(item => item.id === nuevo.id ? nuevo : item) : [...lista, nuevo];
      gestionApi.guardar(config.modulo, lista);
      dialogo.close();
      mostrarTabla();
    });

    // ---------- Botones ----------
    document.getElementById("nuevo").addEventListener("click", () => abrirFormulario());
    document.getElementById("cancelar").addEventListener("click", () => dialogo.close());
    document.getElementById("buscar").addEventListener("input", mostrarTabla);
    document.getElementById("filas").addEventListener("click", evento => {
      const editar = evento.target.dataset.editar;
      const borrar = evento.target.dataset.borrar;
      if (editar) abrirFormulario(lista.find(item => String(item.id) === editar));
      if (borrar) {
        const item = lista.find(i => String(i.id) === borrar);
        if (!confirm(`¿Borrar "${texto(columnas[0], item[columnas[0].campo])}"?`)) return;
        lista = lista.filter(i => i !== item);
        gestionApi.guardar(config.modulo, lista);
        mostrarTabla();
      }
    });

    // ---------- Inicio ----------
    lista = await gestionApi.cargar(config.modulo);
    mostrarTabla();
  });
}
