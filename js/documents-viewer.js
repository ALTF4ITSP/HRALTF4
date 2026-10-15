document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(window.location.search);
  const rawId = params.get("id");
  // Se completan con los datos del documento (php/documents-get.php)
  const data = {
    id: rawId || "—",
    title: "Cargando documento...",
    patient: "—",
    type: "pdf",
    kind: "—",
    size: "—",
    author: "—",
    uploaded: "—",
    updated: "—",
    source: null,
    pages: 1
  };
  const state = { page: 1, zoom: 100, rotation: 0, thumbnails: false };
  let toastTimer;

  function renderData() {
    $("document-title").textContent = data.title;
    $("patient-name").textContent = data.patient;
    $("document-id").textContent = data.id;
    $("document-kind").textContent = data.kind;
    $("document-format").textContent = data.type.toUpperCase();
    $("document-size").textContent = data.size;
    $("document-author").textContent = data.author;
    $("document-uploaded").textContent = data.uploaded;
    $("document-updated").textContent = data.updated;
    $("qr-document-id").textContent = data.id;
    $("total-pages").textContent = String(data.pages);
    $("page-input").max = String(data.pages);
    document.title = `${data.title} · Visor de documentos`;
  }

  function renderThumbnails() {
    const list = $("thumbnail-list");
    list.replaceChildren();
    for (let page = 1; page <= data.pages; page += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "thumbnail-button";
      button.dataset.page = String(page);
      button.setAttribute("aria-label", `Ir a la página ${page}`);
      button.innerHTML = '<span class="thumbnail-page" aria-hidden="true"></span><span class="thumbnail-number"></span>';
      button.querySelector(".thumbnail-number").textContent = String(page);
      button.addEventListener("click", () => setPage(page));
      list.append(button);
    }
    updateActiveThumbnail();
  }

  function updateActiveThumbnail() {
    $("thumbnail-list").querySelectorAll(".thumbnail-button").forEach((button) => {
      if (Number(button.dataset.page) === state.page) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
  }


  function setPage(value) {
    const parsed = Number.parseInt(value, 10);
    state.page = Number.isFinite(parsed) ? Math.min(data.pages, Math.max(1, parsed)) : state.page;
    $("page-input").value = String(state.page);
    $("document-sheet").setAttribute("aria-label", `Vista previa de la página ${state.page}`);
    $("viewer-status").textContent = `Página ${state.page} de ${data.pages}.`;
    updateActiveThumbnail();
    $("thumbnail-list").querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest" });
    if (data.source && data.type === "pdf") {
      $("document-pdf").src = `${data.source}#navpanes=0&view=FitH`;
    }
    $("document-viewport").scrollTop = 0;
  }

  function updateTransform() {
    const rotated = state.rotation % 180 !== 0;
    const viewport = $("document-viewport");
    const pageWidth = rotated ? 1061 : 750;
    const pageHeight = rotated ? 750 : 1061;
    const availableWidth = Math.max(1, (viewport.clientWidth || 760) - 20);
    const availableHeight = Math.max(1, (viewport.clientHeight || 520) - 20);
    const fitScale = Math.min(availableWidth / pageWidth, availableHeight / pageHeight, 1);
    const scale = (state.zoom / 100) * fitScale;
    $("page-frame").style.width = `${Math.round(pageWidth * scale)}px`;
    $("page-frame").style.height = `${Math.round(pageHeight * scale)}px`;
    $("document-sheet").style.transform = `translate(-50%, -50%) rotate(${state.rotation}deg) scale(${scale})`;
    $("zoom-reset").textContent = `${state.zoom}%`;
    $("zoom-out").disabled = state.zoom <= 50;
    $("zoom-in").disabled = state.zoom >= 200;
    $("viewer-status").textContent = `Zoom ${state.zoom}%, rotación ${state.rotation} grados.`;
  }

  function renderSource() {
    const image = $("document-image");
    const pdf = $("document-pdf");
    const unavailable = $("unavailable-preview");
    image.hidden = true;
    pdf.hidden = true;
    unavailable.hidden = true;
    if (!data.source) return;
    if (["png", "jpg"].includes(data.type)) {
      image.src = data.source;
      image.hidden = false;
      image.onerror = () => {
        image.hidden = true;
        unavailable.hidden = false;
      };
    } else if (data.type === "pdf") {
      pdf.src = `${data.source}#navpanes=0&view=FitH`;  // sin la barra lateral del visor de PDF
      pdf.hidden = false;
    } else {
      unavailable.hidden = false;
    }
  }

  function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 3500);
  }

  function shareUrl() { return window.location.href; }

  async function copyLink() {
    const url = shareUrl();
    try {
      await navigator.clipboard.writeText(url);
    } catch (_) {
      const input = $("share-url");
      const wasOpen = $("share-dialog").open;
      if (!wasOpen) $("share-dialog").showModal();
      input.value = url;
      input.select();
      if (!document.execCommand("copy")) {
        showToast("Seleccioná y copiá el enlace del cuadro.");
        return;
      }
      if (!wasOpen) $("share-dialog").close();
    }
    showToast("Enlace copiado.");
  }

  function closeMenu() {
    $("more-menu").hidden = true;
    $("more-button").setAttribute("aria-expanded", "false");
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }


  function download() {
    if (!data.source) return;
    window.location.href = `../php/documents-file.php?id=${encodeURIComponent(data.id)}&descargar=1`;
  }

  function drawMockQr() {
    const canvas = $("qr-canvas");
    const context = canvas.getContext("2d");
    const cells = 33;
    const size = canvas.width / cells;
    let seed = 2166136261;
    for (const character of shareUrl()) seed = Math.imul(seed ^ character.charCodeAt(0), 16777619) >>> 0;
    const random = () => {
      seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
      return (seed >>> 0) / 4294967296;
    };
    const reserved = (x, y) => (x < 9 && y < 9) || (x >= cells - 9 && y < 9) || (x < 9 && y >= cells - 9);
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#111827";
    for (let y = 0; y < cells; y += 1) {
      for (let x = 0; x < cells; x += 1) {
        if (!reserved(x, y) && (random() > .54 || ((x === 8 || y === 8) && (x + y) % 2 === 0))) context.fillRect(x * size, y * size, size, size);
      }
    }
    const finder = (x, y) => {
      context.fillStyle = "#111827";
      context.fillRect(x * size, y * size, size * 7, size * 7);
      context.fillStyle = "#fff";
      context.fillRect((x + 1) * size, (y + 1) * size, size * 5, size * 5);
      context.fillStyle = "#111827";
      context.fillRect((x + 2) * size, (y + 2) * size, size * 3, size * 3);
    };
    finder(1, 1);
    finder(cells - 8, 1);
    finder(1, cells - 8);
  }

  $("toggle-thumbnails").addEventListener("click", () => {
    state.thumbnails = !state.thumbnails;
    $("thumbnail-rail").hidden = !state.thumbnails;
    $("viewer-body").classList.toggle("thumbnails-hidden", !state.thumbnails);
    $("toggle-thumbnails").setAttribute("aria-pressed", String(state.thumbnails));
    $("toggle-thumbnails").setAttribute("aria-label", state.thumbnails ? "Ocultar miniaturas" : "Mostrar miniaturas");
  });
  $("page-input").addEventListener("change", (event) => setPage(event.target.value));
  $("page-input").addEventListener("keydown", (event) => {
    if (event.key === "Enter") { setPage(event.currentTarget.value); event.currentTarget.blur(); }
  });
  $("zoom-out").addEventListener("click", () => { state.zoom = Math.max(50, state.zoom - 10); updateTransform(); });
  $("zoom-in").addEventListener("click", () => { state.zoom = Math.min(200, state.zoom + 10); updateTransform(); });
  $("zoom-reset").addEventListener("click", () => { state.zoom = 100; updateTransform(); });
  $("rotate-button").addEventListener("click", () => { state.rotation = (state.rotation + 90) % 360; updateTransform(); });
  $("fullscreen-button").addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await $("viewer-container").requestFullscreen();
    } catch (_) { showToast("La pantalla completa no está disponible en este navegador."); }
  });
  document.addEventListener("fullscreenchange", () => {
    $("fullscreen-button").setAttribute("aria-label", document.fullscreenElement ? "Salir de pantalla completa" : "Pantalla completa");
  });
  $("download-button").addEventListener("click", download);
  $("share-button").addEventListener("click", () => { $("share-url").value = shareUrl(); $("share-dialog").showModal(); });
  $("more-button").addEventListener("click", (event) => {
    event.stopPropagation();
    const open = $("more-menu").hidden;
    $("more-menu").hidden = !open;
    $("more-button").setAttribute("aria-expanded", String(open));
  });
  $("copy-link-menu").addEventListener("click", () => { closeMenu(); copyLink(); });
  $("reset-view-menu").addEventListener("click", () => {
    closeMenu(); state.zoom = 100; state.rotation = 0; setPage(1); updateTransform(); showToast("Vista restablecida.");
  });
  document.addEventListener("click", (event) => { if (!event.target.closest(".more-wrap")) closeMenu(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeMenu(); });
  $("print-button").addEventListener("click", () => window.print());
  $("qr-button").addEventListener("click", () => { drawMockQr(); $("qr-dialog").showModal(); });
  $("delete-button").addEventListener("click", async () => {
    if (!window.confirm(`¿Eliminar «${data.title}»? Se borra el documento y su archivo. No se puede deshacer.`)) return;
    try {
      const body = new FormData();
      body.append("id_documento", data.id);
      const response = await fetch("../php/documents-delete.php", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok || payload.success !== true) throw new Error(payload?.error?.message);
      window.location.href = "documents.html";
    } catch (error) {
      showToast(error.message || "No se pudo eliminar el documento.");
    }
  });
  $("copy-share-link").addEventListener("click", copyLink);
  $("copy-qr-link").addEventListener("click", copyLink);
  document.querySelectorAll("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
  document.querySelectorAll("dialog").forEach((dialog) => dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); }));

  // Las miniaturas empiezan ocultas: un PDF trae su propia barra para pasar de página
  $("thumbnail-rail").hidden = true;
  $("viewer-body").classList.add("thumbnails-hidden");
  $("toggle-thumbnails").setAttribute("aria-pressed", "false");

  renderData();
  renderThumbnails();
  renderSource();
  setPage(1);
  updateTransform();
  if ("ResizeObserver" in window) new ResizeObserver(updateTransform).observe($("document-viewport"));
  else window.addEventListener("resize", updateTransform);

  // Tamaño legible: 91112 → "89 KB"
  const sizeText = (bytes) => bytes === null ? "—"
    : bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

  async function loadDocument() {
    try {
      const response = await fetch(`../php/documents-get.php?id=${encodeURIComponent(rawId || "")}`, { headers: { Accept: "application/json" } });
      const payload = await response.json();
      if (!response.ok || payload.success !== true) throw new Error(payload?.error?.message);
      const item = payload.data;
      data.title = item.titulo;
      data.patient = item.paciente || "Paciente no indicado";
      data.kind = item.tipo;
      data.type = item.extension === "jpeg" ? "jpg" : item.extension;
      data.size = sizeText(item.tamano);
      data.author = item.autor || "—";
      data.uploaded = item.fecha_texto;
      data.updated = `Versión ${item.version}`;
      data.source = item.tamano === null ? null : `../php/documents-file.php?id=${encodeURIComponent(item.id_documento)}`;
      renderData(); renderThumbnails(); renderSource(); setPage(1);
      if (!data.source) showToast("El archivo de este documento no está en el servidor.");
    } catch (error) {
      data.title = "Documento no encontrado";
      renderData();
      $("unavailable-preview").hidden = false;
      showToast(error.message || "No se pudo cargar el documento.");
    }
  }

  loadDocument();
});
