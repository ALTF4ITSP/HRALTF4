document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(window.location.search);
  const formats = new Set(["pdf", "docx", "pptx", "png", "jpg", "jpeg"]);
  const sampleDocuments = {
    1: { title: "DOCUMENTO 1", type: "pdf", size: "2.4 MB" },
    2: { title: "DOCUMENTO 2", type: "docx", size: "1.8 MB" },
    3: { title: "DOCUMENTO 3", type: "pptx", size: "860 KB" },
    4: { title: "DOCUMENTO 4", type: "png", size: "1.2 MB" },
    5: { title: "DOCUMENTO 5", type: "jpg", size: "—" }
  };
  const queryValue = (...names) => {
    for (const name of names) {
      const value = params.get(name)?.trim();
      if (value) return value;
    }
    return null;
  };
  const normalizeFormat = (value) => {
    const format = String(value || "").replace(/^\./, "").toLowerCase();
    return formats.has(format) ? (format === "jpeg" ? "jpg" : format) : "pdf";
  };
  const safeSource = (value) => {
    if (!value) return null;
    try {
      const url = new URL(value, window.location.href);
      if (["http:", "https:", "file:"].includes(url.protocol)) return url.href;
    } catch (_) { /* Invalid optional preview URL. */ }
    return null;
  };

  const rawId = queryValue("id");
  const sample = rawId && sampleDocuments[rawId] && !queryValue("title", "name") ? sampleDocuments[rawId] : null;
  const type = normalizeFormat(queryValue("type", "format") || sample?.type);
  const pageCountValue = Number.parseInt(queryValue("pages"), 10);
  const data = {
    id: rawId || "DOC-2026-00045",
    title: queryValue("title", "name") || sample?.title || "DOCUMENTO MEDICO: Prostatectomía radical",
    patient: queryValue("patient") || (sample ? "Paciente no indicado" : "Juan Benitez"),
    type,
    kind: queryValue("kind", "documentType") || "Informe Médico",
    size: queryValue("size") || sample?.size || "2.4 MB",
    author: queryValue("author") || "Usuario",
    uploaded: queryValue("uploaded", "date") || (sample ? "31/07/2026" : "24/07/2026"),
    updated: queryValue("updated") || "28/07/2026 · 5:46 PM",
    source: safeSource(queryValue("source", "file")),
    pages: Number.isInteger(pageCountValue) && pageCountValue > 0 ? Math.min(pageCountValue, 30) : (["png", "jpg"].includes(type) ? 1 : 5)
  };
  const state = { page: 1, zoom: 100, rotation: 0, thumbnails: true };
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

  function updateMockPage() {
    const content = $("mock-page-content");
    content.replaceChildren();
    if (state.page === 1 || data.source) return;
    const title = document.createElement("h3");
    title.textContent = `PÁGINA ${state.page}`;
    content.append(title);
    for (let i = 0; i < 11; i += 1) {
      const line = document.createElement("span");
      line.className = `line${i % 5 === 4 ? " short" : i % 3 === 2 ? " medium" : ""}`;
      content.append(line);
    }
  }

  function setPage(value) {
    const parsed = Number.parseInt(value, 10);
    state.page = Number.isFinite(parsed) ? Math.min(data.pages, Math.max(1, parsed)) : state.page;
    $("page-input").value = String(state.page);
    $("document-sheet").setAttribute("aria-label", `Vista previa de la página ${state.page}`);
    $("viewer-status").textContent = `Página ${state.page} de ${data.pages}.`;
    updateActiveThumbnail();
    $("thumbnail-list").querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest" });
    updateMockPage();
    if (data.source && data.type === "pdf") {
      $("document-pdf").src = `${data.source.split("#")[0]}#page=${state.page}&toolbar=0&navpanes=0`;
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
      pdf.src = `${data.source.split("#")[0]}#page=${state.page}&toolbar=0&navpanes=0`;
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

  function mockPdf() {
    const pdfText = (value) => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\x20-\x7e]/g, "?").replace(/[\\()]/g, "\\$&").slice(0, 80);
    const lines = ["Documento de demostracion", data.title, `Paciente: ${data.patient}`, `ID: ${data.id}`];
    const stream = `BT\n/F1 16 Tf\n72 730 Td\n${lines.map((line, index) => `${index ? "0 -32 Td\n" : ""}(${pdfText(line)}) Tj\n`).join("")}ET\n`;
    const objects = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
      `<< /Length ${stream.length} >>\nstream\n${stream}endstream`
    ];
    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((object, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xref = pdf.length;
    pdf += `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, "0")} 00000 n \n`; });
    pdf += `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return new Blob([pdf], { type: "application/pdf" });
  }

  function download() {
    if (data.source) {
      const link = document.createElement("a");
      link.href = data.source;
      link.download = `${data.id}.${data.type}`;
      link.rel = "noopener";
      document.body.append(link);
      link.click();
      link.remove();
      return;
    }
    const markup = `<!doctype html><html lang="es"><meta charset="utf-8"><title>${escapeHtml(data.title)}</title><style>body{font:16px Arial,sans-serif;max-width:720px;margin:70px auto;color:#243047}h1{font-size:24px}dl{display:grid;grid-template-columns:150px 1fr;gap:12px}dt{font-weight:bold}</style><h1>${escapeHtml(data.title)}</h1><p>Ficha de demostración del visor de documentos.</p><dl><dt>Paciente</dt><dd>${escapeHtml(data.patient)}</dd><dt>ID</dt><dd>${escapeHtml(data.id)}</dd><dt>Formato indicado</dt><dd>${escapeHtml(data.type.toUpperCase())}</dd><dt>Subido por</dt><dd>${escapeHtml(data.author)}</dd></dl></html>`;
    const pdf = data.type === "pdf";
    const url = URL.createObjectURL(pdf ? mockPdf() : new Blob([markup], { type: "text/html;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${data.id.replace(/[^\w-]/g, "-")}-demo.${pdf ? "pdf" : "html"}`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(pdf ? "Se descargó un PDF de demostración." : "Se descargó una ficha de demostración.");
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
  $("delete-button").addEventListener("click", () => {
    if (window.confirm(`¿Eliminar «${data.title}»? Esta demostración volverá a la lista sin borrar archivos.`)) window.location.href = "documents.html";
  });
  $("copy-share-link").addEventListener("click", copyLink);
  $("copy-qr-link").addEventListener("click", copyLink);
  document.querySelectorAll("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
  document.querySelectorAll("dialog").forEach((dialog) => dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); }));

  const searchButton = document.querySelector(".viewer-topbar .search-action");
  const searchInput = document.querySelector(".viewer-topbar .search-input");
  const searchHost = document.querySelector(".viewer-topbar");
  searchButton?.addEventListener("click", () => {
    const open = !searchHost.classList.contains("search-active");
    searchHost.classList.toggle("search-active", open);
    searchButton.setAttribute("aria-expanded", String(open));
    searchButton.setAttribute("aria-label", open ? "Cerrar búsqueda" : "Abrir búsqueda");
    searchInput.tabIndex = open ? 0 : -1;
    if (open) searchInput.focus();
    else { searchInput.value = ""; searchButton.focus(); }
  });
  searchInput?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") searchButton.click();
    if (event.key === "Enter" && searchInput.value.trim()) {
      const matches = data.title.toLocaleLowerCase().includes(searchInput.value.trim().toLocaleLowerCase());
      showToast(matches ? "El título coincide con la búsqueda." : "No hay coincidencias en el título.");
    }
  });

  renderData();
  renderThumbnails();
  renderSource();
  setPage(1);
  updateTransform();
  if ("ResizeObserver" in window) new ResizeObserver(updateTransform).observe($("document-viewport"));
  else window.addEventListener("resize", updateTransform);

  if (rawId && /^\d+$/.test(rawId) && !queryValue("title", "name")) {
    fetch(`../../api-connection/documents/get.php?id=${encodeURIComponent(rawId)}`, { headers: { Accept: "application/json" } })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (!payload?.success || !payload.data) return;
        const item = payload.data;
        data.title = item.titulo || data.title;
        data.kind = item.tipo || data.kind;
        data.uploaded = item.fecha || data.uploaded;
        data.type = normalizeFormat(item.ruta_archivo?.split(".").pop() || data.type);
        if (!queryValue("pages")) data.pages = ["png", "jpg"].includes(data.type) ? 1 : 5;
        renderData(); renderThumbnails(); renderSource(); setPage(1);
      })
      .catch(() => { /* The static mockup remains usable without the PHP API. */ });
  }
});
