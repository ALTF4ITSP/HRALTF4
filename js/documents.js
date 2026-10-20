// Lista de documentos (documents.html): buscador + tabla con Ver, Editar y Borrar.
// Los datos vienen de php/documents-list.php.
document.addEventListener("DOMContentLoaded", async () => {
  "use strict";
  const filas = document.getElementById("filas");
  let documentos = [];

  const escapeHtml = valor => {
    const span = document.createElement("span");
    span.textContent = valor ?? "";
    return span.innerHTML;
  };

  function mostrar() {
    const busqueda = document.getElementById("buscar").value.trim().toLowerCase();
    const visibles = documentos.filter(d => `${d.titulo} ${d.tipo} ${d.extension}`.toLowerCase().includes(busqueda));

    filas.innerHTML = visibles.length ? visibles.map(d => `
      <tr>
        <td><a href="documents-viewer.html?id=${d.id_documento}">${escapeHtml(d.titulo)}</a></td>
        <td>${escapeHtml(d.tipo)}</td>
        <td>${escapeHtml(d.extension.toUpperCase())}</td>
        <td>${escapeHtml(d.fecha)}</td>
        <td class="botones">
          <a href="documents-viewer.html?id=${d.id_documento}" class="boton secundario">Ver</a>
          <a href="documents-upload.html?id=${d.id_documento}" class="boton secundario">Editar</a>
          <button type="button" class="peligro" data-borrar="${d.id_documento}">Borrar</button>
        </td>
      </tr>`).join("")
      : '<tr><td colspan="5" class="ayuda">No hay documentos.</td></tr>';
  }

  // Borrar: pide confirmación y avisa a php/documents-delete.php
  filas.addEventListener("click", async evento => {
    const id = evento.target.dataset.borrar;
    if (!id) return;
    const documento = documentos.find(d => String(d.id_documento) === id);
    if (!confirm(`¿Borrar "${documento.titulo}"?`)) return;

    const datos = new FormData();
    datos.append("id_documento", id);
    const respuesta = await (await fetch("../php/documents-delete.php", { method: "POST", body: datos })).json();
    if (!respuesta.success) return alert(respuesta.error?.message || "No se pudo borrar.");
    documentos = documentos.filter(d => d !== documento);
    mostrar();
  });

  document.getElementById("buscar").addEventListener("input", mostrar);

  const respuesta = await (await fetch("../php/documents-list.php")).json();
  documentos = respuesta.data || [];
  mostrar();
});
