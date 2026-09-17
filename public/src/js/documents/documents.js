document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  const grid = document.getElementById("documentsGrid");
  const searchInput = document.querySelector(".search-input");
  const prevButton = document.getElementById("prevDocs");
  const nextButton = document.getElementById("nextDocs");
  const pageSize = 4;
  let currentPage = 1;
  if (!grid) return;
  let documents = Array.from(grid.querySelectorAll(".document-link")).map((link) => ({
    id_documento: link.dataset.documentId,
    titulo: link.querySelector(".document-name")?.textContent.trim() || "",
    descripcion: "",
    fecha: link.querySelector(".document-date")?.textContent.trim() || "",
    sample: true
  }));

  function escapeHtml(value) {
    const element = document.createElement("span");
    element.textContent = value ?? "";
    return element.innerHTML;
  }

  function matches() {
    const query = (searchInput?.value || "").trim().toLowerCase();
    return query ? documents.filter((item) =>
      `${item.titulo} ${item.descripcion || ""}`.toLowerCase().includes(query)
    ) : documents;
  }

  function render() {
    const filtered = matches();
    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
    currentPage = Math.min(currentPage, pageCount);
    const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const cards = visible.map((item) => `
      <a href="documents-viewer.html?id=${item.id_documento}" class="document-link" data-document-id="${item.id_documento}">
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
        </article>
      </a>`).join("");
    const emptySlots = Array.from(
      { length: pageSize - visible.length },
      () => '<div class="document-placeholder" aria-hidden="true"></div>'
    ).join("");

    grid.innerHTML = cards + emptySlots;
    if (!visible.length) {
      grid.querySelector(".document-placeholder").innerHTML = '<p class="documents-empty">No se encontraron documentos.</p>';
      grid.querySelector(".document-placeholder").classList.add("has-message");
    }
    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === pageCount;
  }

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
          const response = await fetch("../../../api/documents/delete.php", { method: "POST", body });
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

  document.addEventListener("click", closeMenus);
  searchInput?.addEventListener("input", () => { currentPage = 1; render(); });
  prevButton?.addEventListener("click", () => { currentPage -= 1; render(); });
  nextButton?.addEventListener("click", () => { currentPage += 1; render(); });

  render();

  fetch("../../../api/documents/list.php", { headers: { Accept: "application/json" } })
    .then((response) => response.json().then((payload) => ({ response, payload })))
    .then(({ response, payload }) => {
      if (!response.ok || payload.success !== true) throw new Error(payload?.error?.message || "No se pudieron cargar los documentos.");
      if (payload.data.length) documents = payload.data;
      render();
    })
    .catch((error) => {
      console.error(error);
    });
});
