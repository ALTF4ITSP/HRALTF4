(() => {
  "use strict";

  // Fictional records for this browser-only mockup. No API or database is used.
  const sampleDoctors = [
    { id: "d-001", title: "Dr.", name: "Carlos Méndez", document: "3.456.781-2", license: "MSP-10482", specialty: "Clínica Médica", service: "Medicina Interna", office: "Sala 2 · Piso 2", phone: "099 123 456", email: "c.mendez@hospital.example", status: "Disponible", shift: "Mañana", days: "Lunes a viernes", startTime: "08:00", endTime: "14:00", notes: "Referente del equipo de Medicina Interna." },
    { id: "d-002", title: "Dra.", name: "Ana Torres", document: "4.128.562-3", license: "MSP-11206", specialty: "Cardiología", service: "Consultorios Externos", office: "Consultorio 12", phone: "098 542 166", email: "a.torres@hospital.example", status: "En consulta", shift: "Mañana", days: "Lunes, miércoles y viernes", startTime: "08:00", endTime: "13:00", notes: "Consultas de control y seguimiento cardiológico." },
    { id: "d-003", title: "Dr.", name: "Miguel Silva", document: "3.987.124-5", license: "MSP-09871", specialty: "Traumatología", service: "Traumatología", office: "Sala 3 · Piso 3", phone: "097 321 550", email: "m.silva@hospital.example", status: "De guardia", shift: "Rotativo", days: "Rotativo", startTime: "08:00", endTime: "20:00", notes: "Guardia de traumatología y valoración de pacientes internados." },
    { id: "d-004", title: "Dra.", name: "Laura Martínez", document: "4.765.219-6", license: "MSP-12540", specialty: "Emergencias", service: "Urgencias", office: "Área de observación", phone: "091 348 760", email: "l.martinez@hospital.example", status: "De guardia", shift: "Tarde", days: "Rotativo", startTime: "14:00", endTime: "22:00", notes: "Atención y coordinación del área de urgencias." },
    { id: "d-005", title: "Dr.", name: "Fernando Ruiz", document: "2.875.643-7", license: "MSP-08734", specialty: "Endocrinología", service: "Consultorios Externos", office: "Consultorio 8", phone: "099 418 300", email: "f.ruiz@hospital.example", status: "Inactivo", shift: "Tarde", days: "Martes y jueves", startTime: "14:00", endTime: "18:00", notes: "Licencia programada. Consultas sujetas a reasignación." },
    { id: "d-006", title: "Dra.", name: "Valentina Costa", document: "4.365.824-8", license: "MSP-13402", specialty: "Cirugía General", service: "Cirugía General", office: "Bloque quirúrgico", phone: "095 230 160", email: "v.costa@hospital.example", status: "En consulta", shift: "Mañana", days: "Lunes a viernes", startTime: "07:00", endTime: "13:00", notes: "Valoración preoperatoria y seguimiento posoperatorio." },
    { id: "d-007", title: "Dra.", name: "Emilia Núñez", document: "4.921.635-9", license: "MSP-14218", specialty: "Dermatología", service: "Consultorios Externos", office: "Consultorio 5", phone: "092 508 144", email: "e.nunez@hospital.example", status: "Disponible", shift: "Tarde", days: "Martes y jueves", startTime: "13:00", endTime: "19:00", notes: "" },
    { id: "d-008", title: "Dr.", name: "Andrés Pereira", document: "3.562.471-0", license: "MSP-10635", specialty: "Emergencias", service: "Urgencias", office: "Box 4", phone: "098 120 341", email: "a.pereira@hospital.example", status: "De guardia", shift: "Noche", days: "Rotativo", startTime: "22:00", endTime: "06:00", notes: "Guardia nocturna de emergencias." },
    { id: "d-009", title: "Dr.", name: "Javier Soto", document: "3.841.962-1", license: "MSP-11783", specialty: "Neurología", service: "Neurología", office: "Consultorio 16", phone: "096 230 711", email: "j.soto@hospital.example", status: "En consulta", shift: "Mañana", days: "Lunes, miércoles y viernes", startTime: "09:00", endTime: "14:00", notes: "" },
    { id: "d-010", title: "Dra.", name: "Inés Cabrera", document: "4.258.716-2", license: "MSP-12892", specialty: "Medicina General", service: "Consultorios Externos", office: "Consultorio 2", phone: "097 752 630", email: "i.cabrera@hospital.example", status: "Disponible", shift: "Tarde", days: "Lunes a viernes", startTime: "14:00", endTime: "20:00", notes: "Consultas de medicina general y controles preventivos." },
    { id: "d-011", title: "Dr.", name: "Pablo Acosta", document: "3.724.159-3", license: "MSP-10954", specialty: "Cardiología", service: "Cardiología", office: "Sala 1 · Piso 2", phone: "099 640 218", email: "p.acosta@hospital.example", status: "Disponible", shift: "Mañana", days: "Lunes a viernes", startTime: "08:00", endTime: "14:00", notes: "" },
    { id: "d-012", title: "Dra.", name: "Sofía Rodríguez", document: "4.638.925-4", license: "MSP-14573", specialty: "Clínica Médica", service: "Medicina Interna", office: "Sala 4 · Piso 2", phone: "098 325 741", email: "s.rodriguez@hospital.example", status: "Inactivo", shift: "Tarde", days: "Lunes a viernes", startTime: "14:00", endTime: "20:00", notes: "" }
  ];
  const storageKey = "hospital.doctorDirectory.v1";
  const pageSize = 5;
  const statusStyles = { Disponible: "available", "En consulta": "consulting", "De guardia": "on-call", Inactivo: "inactive" };
  const fields = ["title", "name", "document", "license", "specialty", "service", "office", "phone", "email", "status", "shift", "days", "startTime", "endTime", "notes"];
  const rows = document.getElementById("doctor-rows");
  const directory = document.querySelector(".doctor-directory");
  const search = document.getElementById("doctor-search");
  const specialtyFilter = document.getElementById("specialty-filter");
  const filters = [...document.querySelectorAll("[data-status]")];
  const pagination = document.getElementById("doctor-pagination");
  const detail = document.getElementById("doctor-detail");
  const scrim = document.getElementById("detail-scrim");
  const form = document.getElementById("doctor-form");
  const dialog = document.getElementById("doctor-dialog");
  const deleteDialog = document.getElementById("delete-dialog");
  const formError = document.getElementById("form-error");
  const newButton = document.getElementById("new-doctor-button");
  if (!rows || !form || !dialog || !detail) return;

  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const normalize = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").trim();
  const identifier = value => normalize(value).replace(/[^a-z0-9]/g, "");
  const fullName = doctor => `${doctor.title} ${doctor.name}`;
  const icon = file => `<img src="../../../assets/Icons/${file}" alt="" aria-hidden="true">`;
  const pill = doctor => `<span class="status-pill status-pill--${statusStyles[doctor.status]}">${escapeHtml(doctor.status)}</span>`;
  const hours = doctor => doctor.startTime && doctor.endTime ? `${doctor.startTime} – ${doctor.endTime}` : "Horario no indicado";
  let doctors = loadDoctors();
  let activeStatus = "Todos";
  let currentPage = 1;
  let selectedId = null;
  let editingId = null;
  let deletingId = null;
  let lastAction = null;
  let formReturnFocus = null;
  let deleteReturnFocus = null;
  let toastTimer;

  function loadDoctors() {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Preserve existing browser records when renaming the inactive state.
          const migrated = parsed.map(doctor => doctor?.status === "Ausente" ? { ...doctor, status: "Inactivo" } : doctor);
          if (migrated.every(doctor => doctor && typeof doctor.id === "string" && fields.every(key => typeof doctor[key] === "string") && Object.hasOwn(statusStyles, doctor.status))) return migrated;
        }
      }
    } catch (_) {
      // Keep the demo usable when storage is blocked or its contents are invalid.
    }
    return sampleDoctors.map(doctor => ({ ...doctor }));
  }

  function saveDoctors(nextDoctors) {
    doctors = nextDoctors;
    try {
      localStorage.setItem(storageKey, JSON.stringify(doctors));
      return true;
    } catch (_) {
      return false;
    }
  }

  function toast(message, persisted = true) {
    const notification = document.getElementById("doctor-toast");
    clearTimeout(toastTimer);
    notification.textContent = message + (persisted ? "" : " Los cambios se conservarán solo durante esta sesión.");
    notification.hidden = false;
    toastTimer = setTimeout(() => { notification.hidden = true; }, 5000);
  }

  function updateCatalogs() {
    const current = specialtyFilter.value;
    // Group spelling and accent variants as the same specialty.
    const unique = key => [...new Map(doctors.map(doctor => [normalize(doctor[key]), doctor[key]])).values()].sort((a, b) => a.localeCompare(b, "es"));
    const specialties = unique("specialty");
    specialtyFilter.innerHTML = '<option value="">Todas las especialidades</option>' + specialties.map(value => `<option value="${escapeHtml(normalize(value))}">${escapeHtml(value)}</option>`).join("");
    specialtyFilter.value = specialties.some(value => normalize(value) === current) ? current : "";
    document.getElementById("specialty-options").innerHTML = specialties.map(value => `<option value="${escapeHtml(value)}"></option>`).join("");
    document.getElementById("service-options").innerHTML = unique("service").map(value => `<option value="${escapeHtml(value)}"></option>`).join("");
    document.getElementById("metric-total").textContent = doctors.length;
    document.getElementById("metric-available").textContent = doctors.filter(doctor => doctor.status === "Disponible").length;
    document.getElementById("metric-on-call").textContent = doctors.filter(doctor => doctor.status === "De guardia").length;
    document.getElementById("metric-specialties").textContent = specialties.length;
  }

  function matchingDoctors() {
    const query = normalize(search.value);
    const compactQuery = identifier(query);
    return doctors.filter(doctor => {
      const matchesStatus = activeStatus === "Todos" || doctor.status === activeStatus;
      const matchesSpecialty = !specialtyFilter.value || normalize(doctor.specialty) === specialtyFilter.value;
      const values = [fullName(doctor), doctor.document, doctor.license, doctor.phone, doctor.specialty, doctor.service, doctor.email];
      const matchesQuery = !query || values.some(value => normalize(value).includes(query) || (compactQuery && identifier(value).includes(compactQuery)));
      return matchesStatus && matchesSpecialty && matchesQuery;
    });
  }

  function actionButton(doctor, action, label, file) {
    return `<button type="button" class="row-action" data-action="${action}" data-id="${escapeHtml(doctor.id)}" aria-label="${label} ${escapeHtml(fullName(doctor))}" title="${label} ${escapeHtml(fullName(doctor))}">${icon(file)}</button>`;
  }

  function row(doctor) {
    return `<tr${selectedId === doctor.id ? ' class="is-selected"' : ""}>
      <td><div class="doctor-identity"><span class="doctor-avatar">${icon("doctor-icon.svg")}</span><div><strong title="${escapeHtml(fullName(doctor))}">${escapeHtml(fullName(doctor))}</strong><small>${escapeHtml(doctor.license)}</small></div></div></td>
      <td><div class="doctor-info">${icon("specialty-icon.svg")}<div><b title="${escapeHtml(doctor.specialty)}">${escapeHtml(doctor.specialty)}</b><small title="${escapeHtml(doctor.service)}">${escapeHtml(doctor.service)}</small></div></div></td>
      <td><div class="doctor-info">${icon("time-icon.svg")}<div><b>${escapeHtml(doctor.shift)} <span class="shift-hours">· ${escapeHtml(hours(doctor))}</span></b><small>${escapeHtml(doctor.phone)}</small></div></div></td>
      <td>${pill(doctor)}</td>
      <td><div class="row-actions">${actionButton(doctor, "view", "Ver detalle de", "eye.svg")}</div></td>
    </tr>`;
  }

  function renderList() {
    const matches = matchingDoctors();
    const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
    currentPage = Math.max(1, Math.min(currentPage, pageCount));
    const start = (currentPage - 1) * pageSize;
    const visible = matches.slice(start, start + pageSize);
    rows.innerHTML = visible.map(row).join("");
    document.querySelector(".doctor-table-container").classList.toggle("is-empty", matches.length === 0);
    document.getElementById("doctor-empty").hidden = matches.length > 0;
    document.getElementById("empty-description").textContent = doctors.length ? "Prueba con otro nombre o ajusta los filtros." : "Agrega el primer médico para comenzar el directorio.";
    document.getElementById("clear-filters").hidden = doctors.length === 0;
    document.getElementById("results-summary").textContent = matches.length ? `Mostrando ${start + 1} a ${start + visible.length} de ${matches.length} ${matches.length === 1 ? "médico" : "médicos"}` : "Mostrando 0 médicos";
    const pages = new Set([1, pageCount, currentPage - 1, currentPage, currentPage + 1]);
    let previous = 0;
    const numbers = [...pages].filter(page => page >= 1 && page <= pageCount).sort((a, b) => a - b).map(page => {
      const gap = previous && page - previous > 1 ? '<span aria-hidden="true">…</span>' : "";
      previous = page;
      return `${gap}<button type="button" data-page="${page}" aria-label="Página ${page}"${page === currentPage ? ' class="is-active" aria-current="page"' : ""}>${page}</button>`;
    }).join("");
    pagination.innerHTML = `<button type="button" data-page="${currentPage - 1}" aria-label="Página anterior"${currentPage === 1 ? " disabled" : ""}>‹</button>${numbers}<button type="button" data-page="${currentPage + 1}" aria-label="Página siguiente"${currentPage === pageCount ? " disabled" : ""}>›</button>`;
  }

  function detailItem(label, value) { return `<dt>${label}</dt><dd>${escapeHtml(value || "No indicado")}</dd>`; }

  function renderDetail(doctor) {
    document.getElementById("detail-content").innerHTML = `<section class="detail-profile">
      <div class="detail-identity"><span class="doctor-avatar">${icon("doctor-icon.svg")}</span><div><h3>${escapeHtml(fullName(doctor))}</h3><p>${escapeHtml(doctor.specialty)}</p></div></div>
      <div class="detail-profile-footer"><span class="registration-label">Registro ${escapeHtml(doctor.license)}</span>${pill(doctor)}</div>
    </section>
    <section class="detail-card"><h3>${icon("person-icon.svg")}Datos de contacto</h3><dl>${detailItem("Documento (C.I.)", doctor.document)}${detailItem("Teléfono", doctor.phone)}${detailItem("Correo electrónico", doctor.email)}</dl></section>
    <section class="detail-card"><h3>${icon("specialty-icon.svg")}Información profesional</h3><dl>${detailItem("Registro MSP", doctor.license)}${detailItem("Especialidad", doctor.specialty)}${detailItem("Servicio", doctor.service)}${detailItem("Consultorio / Área", doctor.office)}</dl></section>
    <section class="detail-card"><h3>${icon("calendar-icon.svg")}Turno y atención</h3><dl>${detailItem("Disponibilidad", doctor.status)}${detailItem("Turno", doctor.shift)}${detailItem("Días de atención", doctor.days)}${detailItem("Horario", hours(doctor))}</dl></section>
    <section class="detail-card"><h3>${icon("document-icon.svg")}Observaciones</h3><p>${escapeHtml(doctor.notes || "Sin observaciones registradas.")}</p></section>`;
  }

  function setBackgroundInert(value) {
    [directory, document.querySelector(".topbar"), document.querySelector(".sidebar"), document.querySelector(".doctor-summary-row")].forEach(element => { element.inert = value; });
  }

  function restoreFocus(target) {
    if (target?.isConnected && !target.closest("[inert]")) { target.focus(); return; }
    const button = lastAction && [...rows.querySelectorAll("[data-action]")].find(item => item.dataset.id === lastAction.id && item.dataset.action === lastAction.action);
    (button || newButton).focus();
  }

  function showDetail(doctor) {
    selectedId = doctor.id;
    renderDetail(doctor);
    renderList();
    setBackgroundInert(true);
    scrim.hidden = false;
    detail.inert = false;
    detail.setAttribute("aria-hidden", "false");
    detail.classList.add("is-open");
    document.getElementById("detail-content").scrollTop = 0;
    requestAnimationFrame(() => {
      if (selectedId === doctor.id && !dialog.open && !deleteDialog.open) document.getElementById("close-detail").focus();
    });
  }

  function closeDetail(restore = true) {
    selectedId = null;
    detail.classList.remove("is-open");
    detail.setAttribute("aria-hidden", "true");
    detail.inert = true;
    scrim.hidden = true;
    setBackgroundInert(false);
    renderList();
    if (restore) restoreFocus();
  }

  function openForm(doctor = null) {
    formReturnFocus = document.activeElement;
    editingId = doctor?.id || null;
    form.reset();
    formError.hidden = true;
    document.getElementById("form-title").textContent = doctor ? "Editar médico" : "Nuevo médico";
    document.getElementById("form-subtitle").textContent = doctor ? `Actualiza la información de ${fullName(doctor)}.` : "Completa la información para agregar un médico al directorio.";
    document.getElementById("save-label").textContent = doctor ? "Guardar cambios" : "Guardar médico";
    if (doctor) fields.forEach(key => { form.elements[key].value = doctor[key]; });
    document.getElementById("form-status-dot").dataset.status = form.elements.status.value;
    dialog.showModal();
    document.querySelector(".doctor-form-fields").scrollTop = 0;
    form.elements.name.focus();
  }

  function openDelete(doctor) {
    deletingId = doctor.id;
    deleteReturnFocus = document.activeElement;
    document.getElementById("delete-description").textContent = `Se eliminará a ${fullName(doctor)} (${doctor.license}) del listado. ¿Deseas continuar?`;
    deleteDialog.showModal();
  }

  function resetFilters() {
    search.value = "";
    specialtyFilter.value = "";
    activeStatus = "Todos";
    currentPage = 1;
    filters.forEach(button => { const active = button.dataset.status === activeStatus; button.classList.toggle("is-active", active); button.setAttribute("aria-pressed", String(active)); });
  }

  rows.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const doctor = doctors.find(item => item.id === button.dataset.id);
    if (!doctor) return;
    lastAction = { id: doctor.id, action: button.dataset.action };
    if (button.dataset.action === "view") showDetail(doctor);
  });
  search.addEventListener("input", () => { currentPage = 1; renderList(); });
  specialtyFilter.addEventListener("change", () => { currentPage = 1; renderList(); });
  filters.forEach(button => button.addEventListener("click", () => {
    activeStatus = button.dataset.status;
    currentPage = 1;
    filters.forEach(item => { const active = item === button; item.classList.toggle("is-active", active); item.setAttribute("aria-pressed", String(active)); });
    renderList();
  }));
  document.getElementById("clear-filters").addEventListener("click", () => { resetFilters(); renderList(); search.focus(); });
  pagination.addEventListener("click", event => {
    const button = event.target.closest("button[data-page]");
    if (!button || button.disabled) return;
    currentPage = Number(button.dataset.page);
    renderList();
    pagination.querySelector('[aria-current="page"]').focus();
  });
  newButton.addEventListener("click", () => openForm());
  document.getElementById("close-detail").addEventListener("click", () => closeDetail());
  scrim.addEventListener("click", () => closeDetail());
  document.getElementById("edit-from-detail").addEventListener("click", () => openForm(doctors.find(doctor => doctor.id === selectedId)));
  document.getElementById("delete-from-detail").addEventListener("click", () => openDelete(doctors.find(doctor => doctor.id === selectedId)));
  document.addEventListener("keydown", event => {
    if (!selectedId || dialog.open || deleteDialog.open) return;
    if (event.key === "Escape") { event.preventDefault(); closeDetail(); }
    if (event.key === "Tab") {
      const buttons = [...detail.querySelectorAll("button")];
      if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1).focus(); }
      else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0].focus(); }
    }
  });

  document.querySelectorAll("[data-close-form]").forEach(button => button.addEventListener("click", () => dialog.close()));
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener("close", () => { editingId = null; if (formReturnFocus) restoreFocus(formReturnFocus); formReturnFocus = null; });
  form.addEventListener("input", () => { formError.hidden = true; });
  form.addEventListener("change", () => { formError.hidden = true; document.getElementById("form-status-dot").dataset.status = form.elements.status.value; });
  form.addEventListener("submit", event => {
    event.preventDefault();
    formError.hidden = true;
    const record = Object.fromEntries(fields.map(key => [key, form.elements[key].value.trim()]));
    const fail = (key, message) => { formError.textContent = message; formError.hidden = false; form.elements[key].focus(); };
    const missing = ["name", "document", "license", "specialty", "service", "phone"].find(key => !record[key]);
    if (missing) { fail(missing, "Completa los campos obligatorios con información válida."); return; }
    if (record.phone.replace(/\D/g, "").length < 8) { fail("phone", "Ingresa un teléfono con al menos 8 dígitos."); return; }
    for (const [key, label] of [["document", "documento"], ["license", "registro MSP"]]) {
      if (!identifier(record[key])) { fail(key, `Ingresa un ${label} válido.`); return; }
      if (doctors.some(doctor => doctor.id !== editingId && identifier(doctor[key]) === identifier(record[key]))) { fail(key, `Ya existe un médico con ese ${label}.`); return; }
    }
    if (Boolean(record.startTime) !== Boolean(record.endTime)) { fail(record.startTime ? "endTime" : "startTime", "Completa ambas horas o deja el horario sin indicar."); return; }
    const wasEditing = Boolean(editingId);
    record.id = editingId || `d-local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const nextDoctors = wasEditing ? doctors.map(doctor => doctor.id === editingId ? record : doctor) : [record, ...doctors];
    const persisted = saveDoctors(nextDoctors);
    resetFilters();
    updateCatalogs();
    currentPage = Math.floor(doctors.findIndex(doctor => doctor.id === record.id) / pageSize) + 1;
    formReturnFocus = null;
    dialog.close();
    showDetail(record);
    toast(wasEditing ? `Datos de ${fullName(record)} actualizados.` : `${fullName(record)} agregado al directorio.`, persisted);
  });

  document.querySelectorAll("[data-close-delete]").forEach(button => button.addEventListener("click", () => deleteDialog.close()));
  deleteDialog.addEventListener("click", event => { if (event.target === deleteDialog) deleteDialog.close(); });
  deleteDialog.addEventListener("close", () => { deletingId = null; if (deleteReturnFocus) restoreFocus(deleteReturnFocus); deleteReturnFocus = null; });
  document.getElementById("confirm-delete").addEventListener("click", () => {
    const doctor = doctors.find(item => item.id === deletingId);
    if (!doctor) return;
    const persisted = saveDoctors(doctors.filter(item => item.id !== doctor.id));
    deleteReturnFocus = null;
    deleteDialog.close();
    updateCatalogs();
    if (selectedId === doctor.id) closeDetail(false);
    else renderList();
    newButton.focus();
    toast(`${fullName(doctor)} eliminado del directorio.`, persisted);
  });

  updateCatalogs();
  renderList();
})();
