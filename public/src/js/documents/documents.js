document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  const grid = document.getElementById("documentsGrid");
  const searchInput = document.getElementById("documentSearchInput");
  const searchButton = document.getElementById("documentSearchButton");
  const listFilters = document.getElementById("documentListFilters");
  const listSearch = document.getElementById("documentListSearch");
  const resultsStatus = document.getElementById("documentResultsStatus");
  const typeButton = document.getElementById("documentTypeButton");
  const typeMenu = document.getElementById("documentTypeMenu");
  const dateButton = document.getElementById("documentDateButton");
  const dateMenu = document.getElementById("documentDateMenu");
  const prevButton = document.getElementById("prevDocs");
  const nextButton = document.getElementById("nextDocs");
  const gridViewButton = document.getElementById("gridView");
  const listViewButton = document.getElementById("listView");
  const pagination = document.querySelector(".documents-pagination");
  const pageSize = 4;
  let currentPage = 1;
  let viewMode = "grid";
  let selectedType = "";
  let selectedDateOrder = "";
  if (!grid) return;
  let documents = Array.from(grid.querySelectorAll(".document-link")).map((link, index) => ({
    id_documento: link.dataset.documentId,
    titulo: link.querySelector(".document-name")?.textContent.trim() || "",
    descripcion: link.dataset.keywords || "",
    fecha: link.querySelector(".document-date")?.textContent.trim() || "",
    tamano: link.querySelector(".document-size")?.textContent.trim() || "—",
    hora: link.querySelector(".document-time")?.textContent.trim() || "",
    extension: link.dataset.fileType || "",
    originalIndex: index,
    sample: true
  }));

  function escapeHtml(value) {
    const element = document.createElement("span");
    element.textContent = value ?? "";
    return element.innerHTML;
  }

  function normalize(value) {
    return String(value || "").toLowerCase().normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").trim();
  }

  function fileType(item) {
    const extension = String(item.extension || item.ruta_archivo?.split(".").pop() || "").toLowerCase();
    return extension === "jpeg" ? "jpg" : extension;
  }

  function documentTimestamp(item) {
    if (item.fecha_carga) {
      const timestamp = Date.parse(String(item.fecha_carga).replace(" ", "T"));
      if (!Number.isNaN(timestamp)) return timestamp;
    }
    const match = String(item.fecha || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;
    const time = String(item.hora || "").match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    let hour = time ? Number(time[1]) % 12 : 0;
    if (time?.[3].toUpperCase() === "PM") hour += 12;
    return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]), hour, time ? Number(time[2]) : 0).getTime();
  }

  function matches() {
    if (viewMode !== "list") return documents;
    const words = normalize(searchInput?.value).split(/\s+/).filter(Boolean);
    const filtered = documents.filter((item) => {
      if (selectedType && fileType(item) !== selectedType) return false;
      const searchable = normalize(`${item.titulo} ${item.descripcion || ""} ${item.palabras_clave || ""}`);
      return words.every((word) => searchable.includes(word));
    });
    if (!selectedDateOrder) return filtered;
    return filtered.sort((a, b) => {
      const aTime = documentTimestamp(a);
      const bTime = documentTimestamp(b);
      if (aTime === null) return bTime === null ? a.originalIndex - b.originalIndex : 1;
      if (bTime === null) return -1;
      const difference = selectedDateOrder === "recent" ? bTime - aTime : aTime - bTime;
      return difference || a.originalIndex - b.originalIndex;
    });
  }

  function render() {
    const filtered = matches();
    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
    currentPage = Math.min(currentPage, pageCount);
    const visible = viewMode === "list"
      ? filtered
      : filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const cards = visible.map((item) => `
      <a href="documents-viewer.html?id=${encodeURIComponent(item.id_documento)}" class="document-link" data-document-id="${escapeHtml(item.id_documento)}" data-file-type="${escapeHtml(fileType(item))}">
        <article class="document-folder-card">
          <button type="button" class="more-options" aria-label="Opciones" aria-expanded="false">⋮</button>
          <div class="document-dropdown-menu"><ul>
            <li><button type="button" class="edit-btn">Editar</button></li>
            <li><button type="button" class="select-btn">Seleccionar</button></li>
            <li><button type="button" class="delete-btn">Eliminar</button></li>
          </ul></div>
          <img src="../../../assets/Icons/folder-icon.svg" alt="">
          <p class="document-date">${escapeHtml(item.fecha)}</p>
          <p class="document-name">${escapeHtml(item.titulo)}</p>
          <p class="document-size">${escapeHtml(item.tamano || item.tamaño || "—")}</p>
          <p class="document-time">${escapeHtml(item.hora || "")}</p>
        </article>
      </a>`).join("");
    const emptySlots = viewMode === "grid" ? Array.from(
      { length: pageSize - visible.length },
      () => '<div class="document-placeholder" aria-hidden="true"></div>'
    ).join("") : "";

    grid.innerHTML = cards + emptySlots;
    if (!visible.length) {
      grid.innerHTML = '<div class="document-placeholder has-message"><p class="documents-empty">No se encontraron documentos.</p></div>';
    }
    grid.classList.toggle("list-view", viewMode === "list");
    pagination.hidden = viewMode === "list";
    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === pageCount;
    if (resultsStatus) resultsStatus.textContent = `${filtered.length} ${filtered.length === 1 ? "documento encontrado" : "documentos encontrados"}.`;
  }

  function setViewMode(mode) {
    closeFilterMenus();
    viewMode = mode;
    currentPage = 1;
    gridViewButton.classList.toggle("active", mode === "grid");
    listViewButton.classList.toggle("active", mode === "list");
    gridViewButton.setAttribute("aria-pressed", String(mode === "grid"));
    listViewButton.setAttribute("aria-pressed", String(mode === "list"));
    listFilters.hidden = mode !== "list";
    listSearch.hidden = mode !== "list";
    render();
  }

  function closeFilterMenus() {
    for (const [button, menu] of [[typeButton, typeMenu], [dateButton, dateMenu]]) {
      button.setAttribute("aria-expanded", "false");
      menu.hidden = true;
    }
  }

  function setupFilter(button, menu, key, onSelect) {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const shouldOpen = menu.hidden;
      closeFilterMenus();
      if (shouldOpen) {
        menu.hidden = false;
        button.setAttribute("aria-expanded", "true");
      }
    });
    button.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        closeFilterMenus();
        menu.hidden = false;
        button.setAttribute("aria-expanded", "true");
        const options = menu.querySelectorAll("button");
        options[event.key === "ArrowDown" ? 0 : options.length - 1].focus();
      } else if (event.key === "Escape") {
        closeFilterMenus();
      }
    });
    menu.addEventListener("click", (event) => {
      const option = event.target.closest(`button[data-${key}]`);
      if (!option) return;
      event.stopPropagation();
      menu.querySelectorAll("button").forEach((item) => {
        item.setAttribute("aria-pressed", String(item === option));
      });
      onSelect(option.dataset[key], option.textContent.trim());
      closeFilterMenus();
      button.focus();
      grid.scrollTop = 0;
      render();
    });
    menu.addEventListener("keydown", (event) => {
      const options = [...menu.querySelectorAll("button")];
      const index = options.indexOf(document.activeElement);
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1
          : (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
        options[next].focus();
      } else if (event.key === "Escape") {
        closeFilterMenus();
        button.focus();
      }
    });
  }

  setupFilter(typeButton, typeMenu, "type", (value, label) => {
    selectedType = value;
    document.getElementById("documentTypeLabel").textContent = `Tipo: ${label}`;
  });
  setupFilter(dateButton, dateMenu, "date", (value, label) => {
    selectedDateOrder = value;
    document.getElementById("documentDateLabel").textContent = value ? label : "Fecha";
  });

  function closeMenus() {
    document.querySelectorAll(".document-dropdown-menu.active").forEach((menu) => {
      menu.classList.remove("active");
      menu.closest(".document-link")?.classList.remove("menu-open");
    });
    document.querySelectorAll('.more-options[aria-expanded="true"]').forEach((button) => {
      button.setAttribute("aria-expanded", "false");
    });
  }

  grid.addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    const card = button.closest(".document-folder-card");

    if (button.classList.contains("more-options")) {
      const menu = card.querySelector(".document-dropdown-menu");
      const open = !menu.classList.contains("active");
      closeMenus();
      menu.classList.toggle("active", open);
      card.closest(".document-link").classList.toggle("menu-open", open);
      button.setAttribute("aria-expanded", String(open));
    } else if (button.classList.contains("edit-btn")) {
      const id = button.closest(".document-link").dataset.documentId;
      window.location.href = `documents-edit.html?id=${encodeURIComponent(id)}`;
    } else if (button.classList.contains("select-btn")) {
      card.classList.toggle("selected");
    } else if (button.classList.contains("delete-btn")) {
      const link = button.closest(".document-link");
      const id = link.dataset.documentId;
      const item = documents.find((document) => String(document.id_documento) === id);
      if (!item || !confirm(`¿Seguro que querés eliminar "${item.titulo}"?`)) return;

      try {
        if (!item.sample) {
          const body = new FormData();
          body.append("id_documento", id);
          const response = await fetch("../../api-connection/documents/delete.php", { method: "POST", body });
          const payload = await response.json();
          if (!response.ok || payload.success !== true) {
            throw new Error(payload?.error?.message || "No se pudo eliminar el documento.");
          }
        }
        documents = documents.filter((document) => String(document.id_documento) !== id);
        render();
      } catch (error) {
        alert(error.message);
      }
    }
  });

  document.addEventListener("click", () => { closeMenus(); closeFilterMenus(); });
  searchInput?.addEventListener("input", () => { currentPage = 1; grid.scrollTop = 0; render(); });
  searchButton?.addEventListener("click", () => searchInput.focus());
  prevButton?.addEventListener("click", () => { currentPage -= 1; render(); });
  nextButton?.addEventListener("click", () => { currentPage += 1; render(); });
  gridViewButton?.addEventListener("click", () => setViewMode("grid"));
  listViewButton?.addEventListener("click", () => setViewMode("list"));

  render();

  fetch("../../api-connection/documents/list.php", { headers: { Accept: "application/json" } })
    .then((response) => response.json().then((payload) => ({ response, payload })))
    .then(({ response, payload }) => {
      if (!response.ok || payload.success !== true) throw new Error(payload?.error?.message || "No se pudieron cargar los documentos.");
      documents = payload.data.map((item, index) => ({
        ...item,
        hora: item.hora || String(item.fecha_carga || "").slice(11, 16),
        originalIndex: index
      }));
      render();
    })
    .catch((error) => {
      console.error(error);
    });
});
