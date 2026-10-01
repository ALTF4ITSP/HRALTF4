(() => {
  "use strict";

  // Illustrative records until the patient API is connected to the clinical database.
  const samplePatients = [
    { id: "p-001", name: "María González López", age: 34, dni: "32.456.789", phone: "099 123 456", status: "Internado", room: "Habitación 204", department: "Medicina Interna", doctor: "Dr. Carlos Méndez", doctorSpecialty: "Clínica Médica", admissionDate: "15 de mar. 2024", bloodType: "O+", allergies: "Penicilina", diagnosis: "Neumonía leve", clinicalState: "Estable", emergencyContact: { name: "José González", phone: "098 765 432", relationship: "Padre" } },
    { id: "p-002", name: "Juan Pérez Ramírez", age: 58, dni: "14.987.321", phone: "098 542 166", status: "Ambulatorio", room: "Ambulatorio", department: "Consultorios Externos", doctor: "Dra. Ana Torres", doctorSpecialty: "Cardiología", admissionDate: "18 de mar. 2024", bloodType: "A+", allergies: "Ninguna conocida", diagnosis: "Control cardiológico", clinicalState: "Estable", emergencyContact: { name: "Sofía Pérez", phone: "099 812 400", relationship: "Hija" } },
    { id: "p-003", name: "Lucía Fernández Díaz", age: 29, dni: "42.123.456", phone: "097 321 550", status: "Internado", room: "Habitación 318", department: "Traumatología", doctor: "Dr. Miguel Silva", doctorSpecialty: "Traumatología", admissionDate: "16 de mar. 2024", bloodType: "B+", allergies: "Látex", diagnosis: "Fractura de tibia", clinicalState: "Estable", emergencyContact: { name: "Martín Fernández", phone: "098 500 914", relationship: "Hermano" } },
    { id: "p-004", name: "Roberto Sánchez Torres", age: 67, dni: "10.456.987", phone: "091 348 760", status: "Urgencias", room: "Urgencias", department: "Observación", doctor: "Dra. Laura Martínez", doctorSpecialty: "Emergencias", admissionDate: "18 de mar. 2024", bloodType: "AB+", allergies: "Ninguna conocida", diagnosis: "Dolor torácico", clinicalState: "En observación", emergencyContact: { name: "Elena Torres", phone: "098 765 100", relationship: "Esposa" } },
    { id: "p-005", name: "Ana Belén Rojas", age: 41, dni: "28.765.432", phone: "099 418 300", status: "Ambulatorio", room: "Ambulatorio", department: "Consultorios Externos", doctor: "Dr. Fernando Ruiz", doctorSpecialty: "Endocrinología", admissionDate: "18 de mar. 2024", bloodType: "O-", allergies: "Ninguna conocida", diagnosis: "Control endocrinológico", clinicalState: "Estable", emergencyContact: { name: "Pablo Rojas", phone: "091 348 901", relationship: "Esposo" } },
    { id: "p-006", name: "Diego Martín Suárez", age: 52, dni: "21.638.475", phone: "095 230 160", status: "Internado", room: "Habitación 112", department: "Cirugía General", doctor: "Dra. Valentina Costa", doctorSpecialty: "Cirugía", admissionDate: "17 de mar. 2024", bloodType: "A-", allergies: "Ibuprofeno", diagnosis: "Recuperación posoperatoria", clinicalState: "Estable", emergencyContact: { name: "Laura Suárez", phone: "098 240 660", relationship: "Hermana" } },
    { id: "p-007", name: "Camila Rodríguez Vega", age: 24, dni: "45.789.120", phone: "092 508 144", status: "Ambulatorio", room: "Ambulatorio", department: "Consultorios Externos", doctor: "Dra. Emilia Núñez", doctorSpecialty: "Dermatología", admissionDate: "18 de mar. 2024", bloodType: "B-", allergies: "Ninguna conocida", diagnosis: "Consulta dermatológica", clinicalState: "Estable", emergencyContact: { name: "Teresa Vega", phone: "095 434 170", relationship: "Madre" } },
    { id: "p-008", name: "Elena Morales Castro", age: 73, dni: "8.502.341", phone: "098 120 341", status: "Urgencias", room: "Urgencias", department: "Observación", doctor: "Dr. Andrés Pereira", doctorSpecialty: "Emergencias", admissionDate: "18 de mar. 2024", bloodType: "O+", allergies: "Sulfas", diagnosis: "Deshidratación", clinicalState: "En observación", emergencyContact: { name: "Daniel Castro", phone: "099 120 800", relationship: "Hijo" } },
    { id: "p-009", name: "Federico Álvarez Medina", age: 39, dni: "33.184.760", phone: "096 230 711", status: "Internado", room: "Habitación 225", department: "Neurología", doctor: "Dr. Javier Soto", doctorSpecialty: "Neurología", admissionDate: "14 de mar. 2024", bloodType: "A+", allergies: "Ninguna conocida", diagnosis: "Evaluación neurológica", clinicalState: "Estable", emergencyContact: { name: "Florencia Medina", phone: "096 330 721", relationship: "Esposa" } },
    { id: "p-010", name: "Valeria Acosta Benítez", age: 46, dni: "26.552.943", phone: "097 752 630", status: "Ambulatorio", room: "Ambulatorio", department: "Consultorios Externos", doctor: "Dra. Inés Cabrera", doctorSpecialty: "Medicina General", admissionDate: "18 de mar. 2024", bloodType: "AB-", allergies: "Penicilina", diagnosis: "Control general", clinicalState: "Estable", emergencyContact: { name: "Luis Acosta", phone: "098 660 122", relationship: "Hermano" } }
  ];

  const storageKey = "hospital.patientDirectory.v1";
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
  const form = document.getElementById("patient-form");
  const formError = document.getElementById("form-error");
  if (!workspace || !list || !detailPanel || !dialog || !form) return;

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const normalize = (value) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const iconFiles = {
    search: "search-icon.svg",
    users: "people-svgrepo-com.svg",
    user: "person-icon.svg",
    bed: "bed-icon.svg",
    house: "house-icon.svg",
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
  const icon = (name) => `<img src="${iconFiles[name] ? `../../../assets/Icons/${iconFiles[name]}` : "#"}" alt="" aria-hidden="true"${name === "chevron" ? ' class="chevron-icon"' : ""}>`;
  const statusStyle = { Internado: "internado", Ambulatorio: "ambulatorio", Urgencias: "urgencias" };
  const allPatients = () => [...customPatients, ...samplePatients];
  let customPatients = [];
  let activeFilter = "Todos";
  let currentPage = 1;
  let selectedPatientId = null;
  let lastSelectionButton = null;

  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (Array.isArray(stored)) {
      customPatients = stored.filter(patient => patient && typeof patient.id === "string" && typeof patient.name === "string" && statusStyle[patient.status]);
    }
  } catch (_) {
    customPatients = [];
  }

  function pill(patient) {
    return `<span class="status-pill status-pill--${statusStyle[patient.status]}">${escapeHtml(patient.status)}</span>`;
  }

  function filteredPatients() {
    const term = normalize(search.value);
    return allPatients().filter(patient => (activeFilter === "Todos" || patient.status === activeFilter) && (!term || [patient.name, patient.dni, patient.phone].some(value => normalize(value).includes(term))));
  }

  function row(patient) {
    const locationIcon = patient.status === "Internado" ? "bed" : patient.status === "Urgencias" ? "ambulance" : "house";
    return `<article class="patient-row${selectedPatientId === patient.id ? " is-selected" : ""}" data-patient-id="${escapeHtml(patient.id)}">
      <div class="patient-identity"><span class="patient-avatar">${icon("user")}</span><span><strong>${escapeHtml(patient.name)}</strong><small>${escapeHtml(patient.age)} años <span aria-hidden="true">|</span> DNI ${escapeHtml(patient.dni)}</small></span></div>
      <div class="patient-info location-info">${icon(locationIcon)}<span><b>${escapeHtml(patient.room)}</b><small>${escapeHtml(patient.department)}</small></span></div>
      <div class="patient-info doctor-info">${icon("user")}<span><b>${escapeHtml(patient.doctor)}</b><small>${escapeHtml(patient.doctorSpecialty)}</small></span></div>
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
        ${detailItem("user", "Doctor asignado", patient.doctor)}
        ${detailItem("bed", "Habitación / Área", `${patient.room} · ${patient.department}`)}
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
    if (restoreFocus && lastSelectionButton) {
      const button = list.querySelector(`[data-select-id="${CSS.escape(lastSelectionButton)}"]`);
      button?.focus();
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
    if (event.key === "Escape" && selectedPatientId && !dialog.open) closeDetail(true);
  });

  document.getElementById("new-patient-button").addEventListener("click", () => {
    form.reset();
    formError.hidden = true;
    dialog.showModal();
    form.elements.name.focus();
  });
  const closeDialog = () => dialog.close();
  document.getElementById("close-patient-dialog").addEventListener("click", closeDialog);
  document.getElementById("cancel-patient").addEventListener("click", closeDialog);
  dialog.addEventListener("click", event => { if (event.target === dialog) closeDialog(); });
  form.addEventListener("submit", event => {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(form).entries());
    const missing = ["name", "dni", "phone", "room", "department", "doctor"].find(key => !fields[key]?.trim());
    if (missing) {
      formError.textContent = "Completa los campos obligatorios con información válida.";
      formError.hidden = false;
      form.elements[missing].focus();
      return;
    }
    const dni = fields.dni.trim();
    if (allPatients().some(patient => normalize(patient.dni) === normalize(dni))) {
      formError.textContent = "Ya existe un paciente con ese documento.";
      formError.hidden = false;
      form.elements.dni.focus();
      return;
    }
    const patient = {
      id: `p-local-${crypto.randomUUID()}`,
      name: fields.name.trim(), age: Number(fields.age), dni, phone: fields.phone.trim(), status: fields.status,
      room: fields.room.trim(), department: fields.department.trim(), doctor: fields.doctor.trim(),
      doctorSpecialty: fields.doctorSpecialty.trim(),
      admissionDate: fields.admissionDate ? new Intl.DateTimeFormat("es-UY", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${fields.admissionDate}T12:00:00Z`)) : "No indicada",
      bloodType: fields.bloodType.trim(), allergies: fields.allergies.trim() || "Ninguna conocida",
      diagnosis: "Sin diagnóstico registrado", clinicalState: "Sin datos",
      emergencyContact: { name: fields.emergencyName.trim(), phone: fields.emergencyPhone.trim(), relationship: fields.emergencyRelationship.trim() }
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify([patient, ...customPatients]));
    } catch (_) {
      formError.textContent = "No se pudo guardar el paciente en este navegador. Comprueba el almacenamiento disponible.";
      formError.hidden = false;
      return;
    }
    customPatients.unshift(patient);
    search.value = "";
    activeFilter = "Todos";
    filters.forEach(button => { const active = button.dataset.filter === "Todos"; button.classList.toggle("is-active", active); button.setAttribute("aria-pressed", String(active)); });
    currentPage = 1;
    if (selectedPatientId) closeDetail();
    renderList();
    dialog.close();
    list.querySelector(`[data-select-id="${CSS.escape(patient.id)}"]`)?.focus();
  });

  renderList();
})();
