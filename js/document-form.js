// Formulario de documentos (documents-upload.html). Sin ?id carga uno nuevo; con ?id=3 edita el documento 3.
//   Nuevo  → php/documents-upload.php
//   Editar → php/documents-update.php (el archivo es opcional: si no se elige, queda el que estaba)
document.addEventListener("DOMContentLoaded", async () => {
  "use strict";
  const formulario = document.getElementById("formulario");
  const mensaje = document.getElementById("mensaje");
  const id = new URLSearchParams(window.location.search).get("id");

  // ---------- Modo editar: se cargan los datos que ya tiene ----------
  if (id) {
    document.getElementById("titulo").textContent = "Editar documento";
    document.getElementById("ayudaArchivo").textContent = "(opcional: elegí uno solo si querés reemplazarlo)";
    formulario.elements.archivo.required = false;

    const respuesta = await (await fetch(`../php/documents-get.php?id=${id}`)).json();
    if (!respuesta.success) {
      mensaje.textContent = respuesta.error?.message || "No se encontró el documento.";
      mensaje.className = "error";
      return;
    }
    const documento = respuesta.data;
    const categorias = { "Informe médico": "informe", "Estudio de Laboratorio": "estudio", "Documento Administrativo": "administrativo" };
    formulario.elements.id_documento.value = documento.id_documento;
    formulario.elements.nombre.value = documento.titulo;
    formulario.elements.fecha.value = documento.fecha;
    formulario.elements.categoria.value = categorias[documento.tipo] || "";
    formulario.elements.descripcion.value = documento.descripcion || "";
  }

  // ---------- Guardar ----------
  formulario.addEventListener("submit", async evento => {
    evento.preventDefault();
    const archivo = formulario.elements.archivo.files[0];
    if (archivo && archivo.size > 10 * 1024 * 1024) {
      mensaje.textContent = "El archivo supera los 10 MB.";
      mensaje.className = "error";
      return;
    }

    mensaje.textContent = "Guardando...";
    mensaje.className = "";
    const php = id ? "../php/documents-update.php" : "../php/documents-upload.php";
    const respuesta = await (await fetch(php, { method: "POST", body: new FormData(formulario) })).json();

    if (!respuesta.success) {
      mensaje.textContent = respuesta.error?.message || respuesta.message || "No se pudo guardar.";
      mensaje.className = "error";
      return;
    }
    // Al terminar se abre el documento (uno nuevo muestra su código QR para imprimirlo)
    window.location.href = `documents-viewer.html?id=${id || respuesta.data.id_documento}`;
  });
});
