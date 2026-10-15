// Crear encuesta (survey-new.html). Usa getSurveys/saveSurveys de surveys.js
document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  const form = document.getElementById("surveyForm");
  const questionList = document.getElementById("questionList");
  const addButton = document.getElementById("addQuestion");
  const message = document.getElementById("formMessage");
  if (!form) return;

  const TYPES = {
    opcion: "Opción múltiple",
    calificacion: "Calificación (1 a 5)",
    texto: "Respuesta libre"
  };

  function addQuestion() {
    const question = document.createElement("article");
    question.className = "question-card";
    question.innerHTML = `
      <div class="question-top">
        <span class="question-number"></span>
        <input type="text" class="question-text" placeholder="Escribí la pregunta..." required>
        <button type="button" class="remove-question" aria-label="Eliminar pregunta">
          <img src="../../../assets/Icons/trash-icon.svg" alt="" aria-hidden="true">
        </button>
      </div>
      <div class="question-bottom">
        <select class="question-type">
          ${Object.entries(TYPES).map(([value, label]) => `<option value="${value}">${label}</option>`).join("")}
        </select>
        <textarea class="question-options" placeholder="Una opción por línea&#10;Ej. Sí&#10;No"></textarea>
      </div>
    `;
    questionList.appendChild(question);
    updateNumbers();
    return question;
  }

  function updateNumbers() {
    questionList.querySelectorAll(".question-card").forEach((card, index) => {
      card.querySelector(".question-number").textContent = index + 1;
    });
  }

  questionList.addEventListener("click", (event) => {
    const button = event.target.closest(".remove-question");
    if (!button) return;
    button.closest(".question-card").remove();
    updateNumbers();
  });

  // Las opciones solo se muestran para "Opción múltiple"
  questionList.addEventListener("change", (event) => {
    if (!event.target.classList.contains("question-type")) return;
    const options = event.target.closest(".question-card").querySelector(".question-options");
    options.hidden = event.target.value !== "opcion";
  });

  // Al agregar con el botón se enfoca la nueva pregunta (al cargar la página no, para que no baje sola)
  addButton.addEventListener("click", () => {
    addQuestion().querySelector(".question-text").focus();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const preguntas = Array.from(questionList.querySelectorAll(".question-card")).map((card) => {
      const tipo = card.querySelector(".question-type").value;
      return {
        texto: card.querySelector(".question-text").value.trim(),
        tipo,
        opciones: tipo === "opcion"
          ? card.querySelector(".question-options").value.split("\n").map((o) => o.trim()).filter(Boolean)
          : []
      };
    });

    if (!preguntas.length) {
      message.textContent = "Agregá al menos una pregunta.";
      return;
    }
    if (preguntas.some((p) => p.tipo === "opcion" && p.opciones.length < 2)) {
      message.textContent = "Las preguntas de opción múltiple necesitan al menos 2 opciones.";
      return;
    }

    const surveys = getSurveys();
    surveys.push({
      id: Date.now(),
      titulo: document.getElementById("titulo").value.trim(),
      descripcion: document.getElementById("descripcion").value.trim(),
      categoria: document.getElementById("categoria").value,
      estado: event.submitter?.dataset.estado || "borrador",
      respuestas: 0,
      preguntas
    });
    saveSurveys(surveys);
    window.location.href = "surveys.html";
  });

  addQuestion();
});
