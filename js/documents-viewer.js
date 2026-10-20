// Visor de un documento (documents-viewer.html?id=3): muestra el archivo, sus datos y su código QR.
// Los datos vienen de php/documents-get.php y el archivo de php/documents-file.php.
document.addEventListener("DOMContentLoaded", async () => {
  "use strict";
  const $ = id => document.getElementById(id);
  const id = new URLSearchParams(window.location.search).get("id");

  const respuesta = await (await fetch(`../php/documents-get.php?id=${id}`)).json();
  if (!respuesta.success) {
    $("titulo").textContent = respuesta.error?.message || "No se encontró el documento.";
    return;
  }
  const d = respuesta.data;
  const archivo = `../php/documents-file.php?id=${d.id_documento}`;

  // ---------- Datos ----------
  $("titulo").textContent = d.titulo;
  $("tipo").textContent = d.tipo;
  $("formato").textContent = d.extension.toUpperCase();
  $("tamano").textContent = d.tamano ? `${Math.ceil(d.tamano / 1024)} KB` : "Archivo no encontrado";
  $("autor").textContent = d.autor || "—";
  $("fecha").textContent = d.fecha_texto;
  $("descargar").href = `${archivo}&descargar=1`;
  $("editar").href = `documents-upload.html?id=${d.id_documento}`;

  // ---------- El archivo ----------
  if (d.extension === "pdf") {
    $("archivo").innerHTML = `<iframe src="${archivo}" title="Documento"></iframe>`;
  } else if (["jpg", "jpeg", "png"].includes(d.extension)) {
    $("archivo").innerHTML = `<img src="${archivo}" alt="Documento">`;
  } else {
    $("archivo").innerHTML = '<p class="ayuda">Este formato no se puede ver en el navegador. Usá "Descargar".</p>';
  }

  // ---------- Código QR (QRCode.js) ----------
  // Lleva un enlace que abre el archivo: php/documents-file.php?qr=<código del documento>
  const enlaceQr = new URL(`../php/documents-file.php?qr=${d.qr}`, window.location.href).href;
  new QRCode($("codigoQr"), { text: enlaceQr, width: 200, height: 200 });

  // Imprimir: se arma una página escondida (iframe) solo con el QR y el nombre, y se imprime esa
  $("imprimirQr").addEventListener("click", () => {
    const marco = document.createElement("iframe");
    marco.style.display = "none";
    document.body.append(marco);
    const nombre = document.createElement("h2");
    nombre.textContent = d.titulo;   // textContent: el nombre no se interpreta como HTML
    const imagen = document.createElement("img");
    imagen.src = $("codigoQr").querySelector("canvas").toDataURL();
    marco.contentDocument.body.style.cssText = "font-family: Arial; text-align: center";
    marco.contentDocument.body.append(nombre, imagen);
    marco.contentWindow.print();
  });

  // ---------- Borrar ----------
  $("borrar").addEventListener("click", async () => {
    if (!confirm(`¿Borrar "${d.titulo}"?`)) return;
    const datos = new FormData();
    datos.append("id_documento", d.id_documento);
    const borrado = await (await fetch("../php/documents-delete.php", { method: "POST", body: datos })).json();
    if (!borrado.success) return alert(borrado.error?.message || "No se pudo borrar.");
    window.location.href = "documents.html";
  });
});
