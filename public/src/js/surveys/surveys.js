// Datos de encuestas compartidos por surveys.html, survey-new.html y survey-view.html.
// Por ahora se guardan en el navegador (localStorage) hasta tener el backend en PHP.
const SURVEYS_KEY = "hc-surveys";

const SAMPLE_SURVEYS = [
  {
    id: 1,
    titulo: "Satisfacción general del paciente",
    descripcion: "Tu opinión nos ayuda a mejorar la calidad de atención.",
    categoria: "Atención al paciente",
    estado: "activa",
    respuestas: 318,
    preguntas: [
      { texto: "¿Cómo calificarías la atención recibida?", tipo: "calificacion", opciones: [] },
      {
        texto: "¿Cuánto tiempo esperaste para ser atendido?",
        tipo: "opcion",
        opciones: ["Menos de 15 minutos", "Entre 15 y 30 minutos", "Entre 30 y 60 minutos", "Más de 60 minutos"]
      },
      { texto: "¿Qué aspecto deberíamos mejorar?", tipo: "texto", opciones: [] },
      { texto: "¿Recomendarías nuestro servicio?", tipo: "opcion", opciones: ["Sí", "No"] }
    ]
  },
  {
    id: 2,
    titulo: "Evaluación del servicio de traslados",
    descripcion: "Calidad, puntualidad y trato recibido.",
    categoria: "Traslados",
    estado: "activa",
    respuestas: 186,
    preguntas: [
      { texto: "¿Cómo calificarías el traslado?", tipo: "calificacion", opciones: [] },
      { texto: "¿La ambulancia llegó a tiempo?", tipo: "opcion", opciones: ["Sí", "No"] }
    ]
  },
  {
    id: 3,
    titulo: "Calidad de atención en emergencias",
    descripcion: "Tiempo de espera y atención recibida.",
    categoria: "Emergencias",
    estado: "borrador",
    respuestas: 0,
    preguntas: [
      { texto: "¿Cómo calificarías la atención en emergencias?", tipo: "calificacion", opciones: [] }
    ]
  }
];

function getSurveys() {
  try {
    const saved = JSON.parse(localStorage.getItem(SURVEYS_KEY));
    if (Array.isArray(saved)) return saved;
  } catch (error) {
    // Si falla la lectura usamos los datos de ejemplo.
  }
  return SAMPLE_SURVEYS;
}

function saveSurveys(surveys) {
  try {
    localStorage.setItem(SURVEYS_KEY, JSON.stringify(surveys));
  } catch (error) {
    console.error("No se pudieron guardar las encuestas", error);
  }
}

function escapeHtml(value) {
  const element = document.createElement("span");
  element.textContent = value ?? "";
  return element.innerHTML;
}

// Listado de encuestas (solo corre en surveys.html)
document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  const table = document.getElementById("surveyTable");
  const statusFilter = document.getElementById("statusFilter");
  if (!table) return;

  let surveys = getSurveys();

  function renderStats() {
    document.getElementById("statTotal").textContent = surveys.length;
    document.getElementById("statActive").textContent = surveys.filter((s) => s.estado === "activa").length;
    document.getElementById("statAnswers").textContent = surveys
      .reduce((total, s) => total + (s.respuestas || 0), 0)
      .toLocaleString("es-UY");
  }

  function renderTable() {
    const filter = statusFilter.value;
    const visible = surveys.filter((s) => !filter || s.estado === filter);

    if (!visible.length) {
      table.innerHTML = '<p class="survey-empty">No hay encuestas para mostrar.</p>';
      return;
    }

    table.innerHTML = visible.map((s) => `
      <article class="survey-row">
        <div class="survey-info">
          <strong>${escapeHtml(s.titulo)}</strong>
          <span>${escapeHtml(s.categoria)} · ${s.preguntas.length} preguntas</span>
        </div>
        <span class="survey-status status-${s.estado}">${escapeHtml(s.estado)}</span>
        <span class="survey-answers">${s.respuestas || 0} respuestas</span>
        <div class="survey-actions">
          <a href="survey-view.html?id=${s.id}" class="survey-link">Responder</a>
          <button type="button" class="survey-link delete-link" data-id="${s.id}">Eliminar</button>
        </div>
      </article>
    `).join("");
  }

  table.addEventListener("click", (event) => {
    const button = event.target.closest(".delete-link");
    if (!button) return;
    if (!confirm("¿Eliminar esta encuesta?")) return;
    surveys = surveys.filter((s) => String(s.id) !== button.dataset.id);
    saveSurveys(surveys);
    renderStats();
    renderTable();
  });

  statusFilter.addEventListener("change", renderTable);

  renderStats();
  renderTable();
});
