// Calendario de turnos (calendar.html). Los datos vienen de php/turnos.php
document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  const API = "../php/turnos.php";
  const FIRST_HOUR = 7;   // la grilla va de 07:00
  const LAST_HOUR = 21;   // a 21:00
  const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  const grid = document.getElementById("calendarGrid");
  const weekTitle = document.getElementById("weekTitle");
  const message = document.getElementById("calMessage");
  const dialog = document.getElementById("turnDialog");
  const form = document.getElementById("turnForm");
  const formError = document.getElementById("formError");
  const deleteButton = document.getElementById("deleteTurn");

  // Buscadores de paciente y médico (js/buscador.js)
  const patientSearch = crearBuscador(document.getElementById("turnPatient"), { texto: p => `${p.nombre} · CI ${p.documento}` });
  const doctorSearch = crearBuscador(document.getElementById("turnDoctor"), { texto: m => `${m.nombre} · ${m.especialidad}` });

  let weekStart = mondayOf(new Date());
  let turns = [];
  let editingId = null;

  // ---------- Fechas ----------
  function mondayOf(date) {
    const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    return monday;
  }

  function addDays(date, days) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  // Date → "2026-10-15" (en hora local, sin pasar por UTC)
  function isoDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  // "09:30" → 9.5
  function toHours(time) {
    const [h, m] = time.split(":").map(Number);
    return h + m / 60;
  }

  // 9.5 → "09:30"
  function toTime(hours) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  function escapeHtml(value) {
    const element = document.createElement("span");
    element.textContent = value ?? "";
    return element.innerHTML;
  }

  // ---------- Dibujar la semana ----------
  function render() {
    const end = addDays(weekStart, 6);
    const format = { day: "numeric", month: "long" };
    weekTitle.textContent =
      `${weekStart.toLocaleDateString("es-UY", format)} – ${end.toLocaleDateString("es-UY", { ...format, year: "numeric" })}`;

    const today = isoDate(new Date());
    const hours = Array.from({ length: LAST_HOUR - FIRST_HOUR }, (_, i) => FIRST_HOUR + i);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    // Fila de encabezados: hueco + 7 días
    let html = '<div class="cal-day-head"></div>';
    html += days.map((day, i) => `
      <div class="cal-day-head${isoDate(day) === today ? " is-today" : ""}">
        ${DAYS[i]}<strong>${day.getDate()}</strong>
      </div>`).join("");

    // Columna de horas
    html += `<div class="cal-hours">${hours.map(h => `<div class="cal-hour">${toTime(h)}</div>`).join("")}</div>`;

    // Una columna por día con sus turnos
    html += days.map(day => {
      const date = isoDate(day);
      const dayTurns = turns.filter(turn => turn.fecha === date);
      return `
        <div class="cal-day${date === today ? " is-today" : ""}" data-date="${date}"
             style="height: calc(var(--hour-height) * ${hours.length})">
          ${dayTurns.map(turnBlock).join("")}
        </div>`;
    }).join("");

    grid.innerHTML = html;
  }

  function turnBlock(turn) {
    const start = Math.max(toHours(turn.hora_inicio), FIRST_HOUR);
    const end = Math.min(toHours(turn.hora_fin), LAST_HOUR);
    const top = `calc(var(--hour-height) * ${start - FIRST_HOUR})`;
    const height = `calc(var(--hour-height) * ${Math.max(end - start, 0.25)} - 2px)`;
    const doctor = turn.medico ? ` · ${escapeHtml(turn.medico)}` : "";
    return `
      <button type="button" class="cal-turn state-${turn.estado.toLowerCase()}" data-id="${turn.id_turno}"
              style="top: ${top}; height: ${height}"
              title="${escapeHtml(`${turn.hora_inicio}–${turn.hora_fin} · ${turn.paciente} · ${turn.motivo}`)}">
        <strong>${turn.hora_inicio} ${escapeHtml(turn.paciente)}</strong>
        <span>${escapeHtml(turn.motivo)}${doctor}</span>
      </button>`;
  }

  // ---------- Cargar desde la base ----------
  async function load() {
    const desde = isoDate(weekStart);
    const hasta = isoDate(addDays(weekStart, 6));
    try {
      const response = await fetch(`${API}?desde=${desde}&hasta=${hasta}`, { headers: { Accept: "application/json" } });
      const data = await response.json();
      if (!response.ok || data.success !== true) throw new Error(data?.error?.message);

      turns = data.data;
      patientSearch.setItems(data.pacientes);
      doctorSearch.setItems(data.medicos);
      message.hidden = true;
    } catch (error) {
      turns = [];
      message.textContent = error.message || "No se pudieron cargar los turnos.";
      message.hidden = false;
    }
    render();
  }


  // ---------- Formulario ----------
  function openForm(turn) {
    editingId = turn.id_turno ?? null;
    document.getElementById("dialogTitle").textContent = editingId ? "Editar turno" : "Nuevo turno";
    patientSearch.setValue(turn.id_gestion_paciente);
    doctorSearch.setValue(turn.id_gestion_medico);
    form.elements.fecha.value = turn.fecha;
    form.elements.hora_inicio.value = turn.hora_inicio;
    form.elements.hora_fin.value = turn.hora_fin;
    form.elements.motivo.value = turn.motivo ?? "";
    form.elements.estado.value = turn.estado ?? "PROGRAMADO";
    form.elements.notas.value = turn.notas ?? "";
    formError.textContent = "";
    deleteButton.hidden = !editingId;
    dialog.showModal();
  }

  async function send(body) {
    const response = await fetch(API, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok || data.success !== true) throw new Error(data?.error?.message || "No se pudo guardar.");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const turn = Object.fromEntries(new FormData(form));
    turn.id_turno = editingId;
    if (!turn.id_gestion_paciente) {
      formError.textContent = "Buscá y elegí un paciente de la lista.";
      document.getElementById("turnPatient").focus();
      return;
    }
    try {
      await send({ accion: "guardar", turno: turn });
      dialog.close();
      // Si el turno quedó en otra semana, ir a esa semana
      weekStart = mondayOf(new Date(`${turn.fecha}T12:00`));
      load();
    } catch (error) {
      formError.textContent = error.message;
    }
  });

  deleteButton.addEventListener("click", async () => {
    if (!confirm("¿Eliminar este turno?")) return;
    try {
      await send({ accion: "borrar", id_turno: editingId });
      dialog.close();
      load();
    } catch (error) {
      formError.textContent = error.message;
    }
  });

  document.getElementById("cancelTurn").addEventListener("click", () => dialog.close());

  // Clic en un turno → editar. Clic en un hueco → nuevo turno a esa hora (redondeado a media hora)
  grid.addEventListener("click", (event) => {
    const block = event.target.closest(".cal-turn");
    if (block) {
      openForm(turns.find(turn => String(turn.id_turno) === block.dataset.id));
      return;
    }
    const day = event.target.closest(".cal-day");
    if (!day) return;
    const offset = event.clientY - day.getBoundingClientRect().top;
    const hourHeight = day.getBoundingClientRect().height / (LAST_HOUR - FIRST_HOUR);
    const start = Math.min(FIRST_HOUR + Math.floor((offset / hourHeight) * 2) / 2, LAST_HOUR - 0.5);
    openForm({ fecha: day.dataset.date, hora_inicio: toTime(start), hora_fin: toTime(start + 0.5) });
  });

  // ---------- Navegación ----------
  document.getElementById("newTurn").addEventListener("click", () => {
    const today = new Date();
    const date = isoDate(today) >= isoDate(weekStart) && isoDate(today) <= isoDate(addDays(weekStart, 6)) ? today : weekStart;
    openForm({ fecha: isoDate(date), hora_inicio: "09:00", hora_fin: "09:30" });
  });
  document.getElementById("prevWeek").addEventListener("click", () => { weekStart = addDays(weekStart, -7); load(); });
  document.getElementById("nextWeek").addEventListener("click", () => { weekStart = addDays(weekStart, 7); load(); });
  document.getElementById("todayButton").addEventListener("click", () => { weekStart = mondayOf(new Date()); load(); });

  load();
});
