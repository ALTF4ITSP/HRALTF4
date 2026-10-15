// Buscador para elegir un elemento de una lista larga (pacientes, médicos...).
// Se escribe parte del nombre o de la cédula y aparecen solo las coincidencias.
//
// En el HTML:
//   <div class="buscador">
//     <input type="text" id="...">                     ← lo que escribe la persona
//     <input type="hidden" name="id_gestion_paciente"> ← el id elegido (lo que se envía)
//     <ul class="buscador-lista" hidden></ul>
//   </div>
//
// En el JS:
//   const buscador = crearBuscador(input, { texto: p => `${p.nombre} · CI ${p.documento}` });
//   buscador.setItems(lista);  buscador.setValue(id);  buscador.getValue();
function crearBuscador(input, { texto, maximo = 8 }) {
  const caja = input.closest(".buscador");
  const oculto = caja.querySelector('input[type="hidden"]');
  const lista = caja.querySelector(".buscador-lista");
  let items = [];
  let visibles = [];
  let marcado = -1;

  input.setAttribute("autocomplete", "off");
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-expanded", "false");

  // Sin mayúsculas, acentos, puntos ni guiones: "8.502.341-2" se encuentra escribiendo "85023412"
  const normalizar = valor => String(valor ?? "").toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[.\-]/g, "");

  function mostrar() {
    const palabras = normalizar(input.value).split(/\s+/).filter(Boolean);
    visibles = items.filter(item => palabras.every(palabra => normalizar(texto(item)).includes(palabra))).slice(0, maximo);
    marcado = visibles.length ? 0 : -1;
    lista.innerHTML = visibles.length
      ? visibles.map((item, i) => `<li role="option" data-i="${i}"${i === marcado ? ' class="marcado"' : ""}></li>`).join("")
      : '<li class="sin-resultados">No hay coincidencias</li>';
    // textContent evita que un nombre con símbolos se interprete como HTML
    lista.querySelectorAll("[data-i]").forEach(li => { li.textContent = texto(visibles[li.dataset.i]); });
    lista.hidden = false;
    input.setAttribute("aria-expanded", "true");
  }

  function cerrar() {
    lista.hidden = true;
    input.setAttribute("aria-expanded", "false");
  }

  function elegir(item) {
    oculto.value = item ? item.id : "";
    input.value = item ? texto(item) : "";
    cerrar();
    input.dispatchEvent(new Event("buscador-cambio", { bubbles: true }));
  }

  input.addEventListener("input", () => { oculto.value = ""; mostrar(); });
  // Al entrar al campo se muestran opciones solo si todavía no se eligió nada
  input.addEventListener("focus", () => { if (!oculto.value) mostrar(); });

  input.addEventListener("keydown", (event) => {
    if (lista.hidden) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      marcado = (marcado + (event.key === "ArrowDown" ? 1 : -1) + visibles.length) % visibles.length;
      lista.querySelectorAll("[data-i]").forEach((li, i) => li.classList.toggle("marcado", i === marcado));
    } else if (event.key === "Enter" && marcado >= 0) {
      event.preventDefault();
      elegir(visibles[marcado]);
    } else if (event.key === "Escape") {
      cerrar();
    }
  });

  // mousedown (y no click) para que se elija antes de que el campo pierda el foco
  lista.addEventListener("mousedown", (event) => {
    const li = event.target.closest("[data-i]");
    if (!li) return;
    event.preventDefault();
    elegir(visibles[li.dataset.i]);
  });

  // Si se escribió algo pero no se eligió de la lista, se borra
  input.addEventListener("blur", () => {
    cerrar();
    if (!oculto.value) input.value = "";
  });

  return {
    setItems(nuevos) { items = nuevos; },
    setValue(id) { elegir(items.find(item => String(item.id) === String(id ?? "")) || null); },
    getValue() { return oculto.value; }
  };
}
