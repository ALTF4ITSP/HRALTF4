(() => {
  "use strict";

  const pageSize = 5;
  const workspace = document.getElementById("patient-workspace");
  const list = document.getElementById("patient-list");
  const detailPanel = document.getElementById("detail-panel");
  const detailContent = document.getElementById("detail-content");
  const emptyState = document.getElementById("patient-empty");
  const summary = document.getElementById("results-summary");
  const pagination = document.getElementById("patient-pagination");
  const search = document.getElementById("patient-search");
  const filters = document.querySelectorAll(".filter-button");
  const dialog = document.getElementById("patient-dialog");
  const deleteDialog = document.getElementById("delete-dialog");
  const form = document.getElementById("patient-form");
  const formError = document.getElementById("form-error");
  const deleteError = document.getElementById("delete-error");
  if (!workspace || !list || !detailPanel || !dialog || !deleteDialog || !form) return;

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const normalize = (value) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const iconFiles = {
    search: "search-icon.svg",
    users: "people-svgrepo-com.svg",
    user: "person-icon.svg",
    doctor: "doctor-icon.svg",
    bed: "bed-icon.svg",
    ambulatory: "ambulatory-icon.svg",
    file: "document-icon.svg",
    calendar: "calendar-icon.svg",
    plus: "plus-icon.svg",
    chevron: "arrow-left.svg",
    phone: "phone-icon.svg",
    drop: "bloodtype-icon.svg",
    alert: "alert-icon.svg",
    ambulance: "emergency-icon.svg",
    heart: "hrate-icon.svg"
  };
  const icon = (name) => `<img src="${iconFiles[name] ? `../imagenes/${iconFiles[name]}` : "#"}" alt="" aria-hidden="true"${name === "chevron" ? ' class="chevron-icon"' : ""}>`;
  const statusStyle = { Internado: "internado", Ambulatorio: "ambulatorio", Urgencias: "urgencias" };
  const allPatients = () => patients;
  let patients = [];  // se cargan desde la base al final del archivo
  let activeFilter = "Todos";
  let currentPage = 1;
  let selectedPatientId = null;
  let lastSelectionButton = null;
  let editingPatientId = null;
  let deletingPatientId = null;
  let toastTimer;

  function savePatients(nextPatients) {
    patients = nextPatients;
    gestionApi.guardar("pacientes", patients);
    return true;
  }

  function toast(message) {
    const notification = document.getElementById("patient-toast");
    clearTimeout(toastTimer);
    notification.textContent = message;
    notification.hidden = false;
    toastTimer = setTimeout(() => { notification.hidden = true; }, 4000);
  }

  function admissionDateInput(value) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return value;
    const match = String(value || "").match(/^(\d{1,2})\s+(?:de\s+)?([a-z]+)\.?\s+(?:de\s+)?(\d{4})$/i);
    const months = { ene: "01", feb: "02", mar: "03", abr: "04", may: "05", jun: "06", jul: "07", ago: "08", sep: "09", set: "09", oct: "10", nov: "11", dic: "12" };
    const month = match && months[match[2].toLowerCase().slice(0, 3)];
    return month ? `${match[3]}-${month}-${match[1].padStart(2, "0")}` : "";
  }

  function pill(patient) {
    return `<span class="status-pill status-pill--${statusStyle[patient.status]}">${escapeHtml(patient.status)}</span>`;
  }

  function filteredPatients() {
    const term = normalize(search.value);
    return allPatients().filter(patient => (activeFilter === "Todos" || patient.status === activeFilter) && (!term || [patient.name, patient.dni, patient.phone].some(value => normalize(value).includes(term))));
  }

  function row(patient) {
    const locationIcon = patient.status === "Internado" ? "bed" : patient.status === "Urgencias" ? "ambulance" : "ambulatory";
    return `<article class="patient-row${selectedPatientId === patient.id ? " is-selected" : ""}" data-patient-id="${escapeHtml(patient.id)}">
      <div class="patient-identity"><span class="patient-avatar">${icon("user")}</span><span><strong>${escapeHtml(patient.name)}</strong><small>${escapeHtml(patient.age)} años <span aria-hidden="true">|</span> DNI ${escapeHtml(patient.dni)}</small></span></div>
      <div class="patient-info location-info">${icon(locationIcon)}<span><b>${escapeHtml(patient.room)}</b><small>${escapeHtml(patient.department)}</small></span></div>
      <div class="patient-info doctor-info">${icon("doctor")}<span><b>${escapeHtml(patient.doctor)}</b><small>${escapeHtml(patient.doctorSpecialty)}</small></span></div>
      ${pill(patient)}
      <button type="button" class="row-action" data-select-id="${escapeHtml(patient.id)}" aria-label="Ver detalle de ${escapeHtml(patient.name)}" aria-controls="detail-panel" aria-expanded="${selectedPatientId === patient.id}">${icon("chevron")}</button>
    </article>`;
  }

  function renderPagination(pageCount) {
    const visible = new Set([1, pageCount, currentPage - 1, currentPage, currentPage + 1]);
    const pages = [...visible].filter(page => page >= 1 && page <= pageCount).sort((a, b) => a - b);
    let numbers = "";
    let previous = 0;
    for (const page of pages) {
      if (previous && page - previous > 1) numbers += `<span aria-hidden="true">…</span>`;
      numbers += `<button type="button" data-page="${page}" class="${page === currentPage ? "is-active" : ""}" ${page === currentPage ? 'aria-current="page"' : ""} aria-label="Página ${page}">${page}</button>`;
      previous = page;
    }
    pagination.innerHTML = `<button type="button" data-page="${currentPage - 1}" aria-label="Página anterior" ${currentPage === 1 ? "disabled" : ""}>‹</button>${numbers}<button type="button" data-page="${currentPage + 1}" aria-label="Página siguiente" ${currentPage === pageCount ? "disabled" : ""}>›</button>`;
  }

  function renderList() {
    const matches = filteredPatients();
    const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
    currentPage = Math.min(currentPage, pageCount);
    const start = (currentPage - 1) * pageSize;
    const shown = matches.slice(start, start + pageSize);
    list.innerHTML = shown.map(row).join("");
    emptyState.hidden = matches.length !== 0;
    summary.textContent = matches.length ? `Mostrando ${start + 1} a ${start + shown.length} de ${matches.length} ${matches.length === 1 ? "paciente" : "pacientes"}` : "Mostrando 0 pacientes";
    renderPagination(pageCount);
  }

  function detailItem(iconName, label, value, className = "") {
    return `<dt>${icon(iconName)}${label}</dt><dd class="${className}">${escapeHtml(value || "No indicado")}</dd>`;
  }

  function renderDetail(patient) {
    const emergency = patient.emergencyContact || {};
    detailContent.innerHTML = `<div class="detail-hero">
      <span class="patient-avatar">${icon("user")}</span>
      <div class="detail-hero-text"><strong>${escapeHtml(patient.name)}</strong><p>${escapeHtml(patient.age)} años &nbsp; | &nbsp; DNI ${escapeHtml(patient.dni)}</p><p>${escapeHtml(patient.room)} · ${escapeHtml(patient.department)}</p></div>
      ${pill(patient)}
    </div>
    <div class="detail-grid">
      <section class="detail-card"><h3>Información general</h3><dl>
        ${detailItem("calendar", "Edad", `${patient.age} años`)}
        ${detailItem("file", "Documento", `DNI ${patient.dni}`)}
        ${detailItem("phone", "Teléfono", patient.phone)}
        ${detailItem("drop", "Grupo sanguíneo", patient.bloodType)}
        ${detailItem("alert", "Alergias", patient.allergies)}
        ${detailItem("doctor", "Doctor asignado", patient.doctor)}
        ${detailItem(patient.status === "Ambulatorio" ? "ambulatory" : "bed", "Habitación / Área", `${patient.room} · ${patient.department}`)}
      </dl></section>
      <section class="detail-card"><h3>Contacto de emergencia</h3><dl>
        ${detailItem("user", "Nombre", emergency.name)}
        ${detailItem("phone", "Teléfono", emergency.phone)}
        ${detailItem("users", "Parentesco", emergency.relationship)}
      </dl></section>
      <section class="detail-card"><h3>Estado clínico</h3><dl>
        ${detailItem("heart", "Estado actual", patient.clinicalState || "Sin datos", patient.clinicalState === "Estable" ? "stable" : "")}
        ${detailItem("file", "Diagnóstico", patient.diagnosis)}
        ${detailItem("calendar", "Fecha de ingreso", patient.admissionDate)}
      </dl></section>
    </div>`;
  }

  function closeDetail(restoreFocus = false) {
    selectedPatientId = null;
    workspace.classList.remove("has-selection");
    detailPanel.setAttribute("aria-hidden", "true");
    detailPanel.inert = true;
    renderList();
    if (restoreFocus) {
      const button = lastSelectionButton && list.querySelector(`[data-select-id="${CSS.escape(lastSelectionButton)}"]`);
      (button || document.getElementById("new-patient-button")).focus();
    }
  }

  function selectPatient(id) {
    const patient = allPatients().find(item => item.id === id);
    if (!patient) return;
    selectedPatientId = id;
    lastSelectionButton = id;
    renderDetail(patient);
    detailPanel.inert = false;
    detailPanel.setAttribute("aria-hidden", "false");
    workspace.classList.add("has-selection");
    renderList();
    document.dispatchEvent(new CustomEvent("patient:selected", { detail: { selectedPatientId: id, patient } }));
    document.getElementById("close-detail").focus();
  }

  search.addEventListener("input", () => { currentPage = 1; if (selectedPatientId && !filteredPatients().some(item => item.id === selectedPatientId)) closeDetail(); else renderList(); });
  filters.forEach(button => button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    currentPage = 1;
    filters.forEach(item => { item.classList.toggle("is-active", item === button); item.setAttribute("aria-pressed", String(item === button)); });
    if (selectedPatientId && !filteredPatients().some(item => item.id === selectedPatientId)) closeDetail(); else renderList();
  }));
  list.addEventListener("click", event => {
    const button = event.target.closest("[data-select-id]");
    if (button) selectPatient(button.dataset.selectId);
  });
  pagination.addEventListener("click", event => {
    const button = event.target.closest("[data-page]");
    if (!button || button.disabled) return;
    currentPage = Number(button.dataset.page);
    if (selectedPatientId) closeDetail(); else renderList();
  });
  document.getElementById("close-detail").addEventListener("click", () => closeDetail(true));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && selectedPatientId && !dialog.open && !deleteDialog.open) closeDetail(true);
  });

  function openForm(patient = null) {
    closeDetail();
    form.reset();
    formError.hidden = true;
    editingPatientId = patient?.id ?? null;
    document.getElementById("new-patient-title").textContent = patient ? "Editar datos del paciente" : "Nuevo paciente";
    document.getElementById("form-subtitle").textContent = patient ? `Actualiza los datos de ${patient.name}.` : "Completa los datos para añadir un registro de demostración.";
    document.getElementById("save-label").textContent = patient ? "Guardar cambios" : "Guardar paciente";
    if (patient) {
      ["name", "dni", "age", "phone", "bloodType", "allergies", "status", "room", "department", "doctor", "doctorSpecialty"].forEach(key => {
        form.elements[key].value = patient[key] ?? "";
      });
      form.elements.admissionDate.value = admissionDateInput(patient.admissionDate);
      const emergency = patient.emergencyContact || {};
      form.elements.emergencyName.value = emergency.name || "";
      form.elements.emergencyPhone.value = emergency.phone || "";
      form.elements.emergencyRelationship.value = emergency.relationship || "";
    }
    dialog.querySelector(".dialog-fields").scrollTop = 0;
    dialog.showModal();
    form.elements.name.focus();
  }

  document.getElementById("new-patient-button").addEventListener("click", () => openForm());
  document.getElementById("edit-from-detail").addEventListener("click", () => {
    const patient = allPatients().find(item => item.id === selectedPatientId);
    if (patient) openForm(patient);
  });
  const closeDialog = () => dialog.close();
  document.getElementById("close-patient-dialog").addEventListener("click", closeDialog);
  document.getElementById("cancel-patient").addEventListener("click", closeDialog);
  dialog.addEventListener("click", event => { if (event.target === dialog) closeDialog(); });
  dialog.addEventListener("close", () => {
    const button = editingPatientId && list.querySelector(`[data-select-id="${CSS.escape(editingPatientId)}"]`);
    editingPatientId = null;
    (button || document.getElementById("new-patient-button")).focus();
  });
  form.addEventListener("input", () => { formError.hidden = true; });
  form.addEventListener("change", () => { formError.hidden = true; });
  form.addEventListener("submit", event => {
    event.preventDefault();
    formError.hidden = true;
    const fields = Object.fromEntries(new FormData(form).entries());
    const missing = ["name", "dni", "phone", "room", "department", "doctor"].find(key => !fields[key]?.trim());
    if (missing) {
      formError.textContent = "Completa los campos obligatorios con información válida.";
      formError.hidden = false;
      form.elements[missing].focus();
      return;
    }
    const dni = fields.dni.trim();
    if (allPatients().some(patient => patient.id !== editingPatientId && normalize(patient.dni) === normalize(dni))) {
      formError.textContent = "Ya existe un paciente con ese documento.";
      formError.hidden = false;
      form.elements.dni.focus();
      return;
    }
    const existingPatient = allPatients().find(patient => patient.id === editingPatientId);
    const patient = {
      ...existingPatient,
      id: editingPatientId ?? `p-local-${crypto.randomUUID()}`,
      name: fields.name.trim(), age: Number(fields.age), dni, phone: fields.phone.trim(), status: fields.status,
      room: fields.room.trim(), department: fields.department.trim(), doctor: fields.doctor.trim(),
      doctorSpecialty: fields.doctorSpecialty.trim(),
      admissionDate: fields.admissionDate ? new Intl.DateTimeFormat("es-UY", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${fields.admissionDate}T12:00:00Z`)) : "No indicada",
      bloodType: fields.bloodType.trim(), allergies: fields.allergies.trim() || "Ninguna conocida",
      diagnosis: existingPatient?.diagnosis ?? "Sin diagnóstico registrado", clinicalState: existingPatient?.clinicalState ?? "Sin datos",
      emergencyContact: { name: fields.emergencyName.trim(), phone: fields.emergencyPhone.trim(), relationship: fields.emergencyRelationship.trim() }
    };
    const wasEditing = editingPatientId !== null;
    const nextPatients = wasEditing ? allPatients().map(item => item.id === editingPatientId ? patient : item) : [patient, ...allPatients()];
    if (!savePatients(nextPatients, formError)) return;
    search.value = "";
    activeFilter = "Todos";
    filters.forEach(button => { const active = button.dataset.filter === "Todos"; button.classList.toggle("is-active", active); button.setAttribute("aria-pressed", String(active)); });
    currentPage = Math.floor(allPatients().findIndex(item => item.id === patient.id) / pageSize) + 1;
    renderList();
    dialog.close();
    list.querySelector(`[data-select-id="${CSS.escape(patient.id)}"]`)?.focus();
    toast(wasEditing ? `Datos de ${patient.name} actualizados.` : `Paciente ${patient.name} agregado.`);
  });

  document.getElementById("delete-from-detail").addEventListener("click", () => {
    const patient = allPatients().find(item => item.id === selectedPatientId);
    if (!patient) return;
    deletingPatientId = patient.id;
    deleteError.hidden = true;
    document.getElementById("delete-description").textContent = `Se eliminará a ${patient.name} (DNI ${patient.dni}) del listado. ¿Deseas continuar?`;
    deleteDialog.showModal();
  });
  document.querySelectorAll("[data-close-delete]").forEach(button => button.addEventListener("click", () => deleteDialog.close()));
  deleteDialog.addEventListener("close", () => { deletingPatientId = null; });
  document.getElementById("confirm-delete").addEventListener("click", () => {
    const patient = allPatients().find(item => item.id === deletingPatientId);
    if (!patient) return;
    if (!savePatients(allPatients().filter(item => item.id !== deletingPatientId), deleteError)) return;
    closeDetail();
    deleteDialog.close();
    document.getElementById("new-patient-button").focus();
    toast(`Paciente ${patient.name} eliminado.`);
  });

  renderList();
  gestionApi.cargar("pacientes").then(lista => { patients = lista; renderList(); });
})();
