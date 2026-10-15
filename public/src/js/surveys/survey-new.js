// Crear encuesta (survey-new.html). Usa surveyApi de surveys.js
document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  const form = document.getElementById("surveyForm");
  const questionList = document.getElementById("questionList");
  const addButton = document.getElementById("addQuestion");
  const categorySelect = document.getElementById("categoria");
  const message = document.getElementById("formMessage");
  if (!form) return;

  // Mismos valores que la columna "tipo" de la tabla pregunta
  const TYPES = {
    OPCION: "Opción múltiple",
    ESCALA: "Calificación (1 a 5)",
    SI_NO: "Sí / No",
    TEXTO: "Respuesta libre"
  };

  function addQuestion() {
    const question = document.createElement("article");
    question.className = "question-card";
    question.innerHTML = `
      <div class="question-top">
        <span class="question-number"></span>
        <input type="text" class="question-text" maxlength="500" placeholder="Escribí la pregunta..." required>
        <button type="button" class="remove-question" aria-label="Eliminar pregunta">
          <img src="../../../assets/Icons/trash-icon.svg" alt="" aria-hidden="true">
        </button>
      </div>
      <div class="question-bottom">
        <select class="question-type">
          ${Object.entries(TYPES).map(([value, label]) => `<option value="${value}">${label}</option>`).join("")}
        </select>
        <textarea class="question-options" placeholder="Una opción por línea&#10;Ej. Menos de 15 minutos&#10;Más de 15 minutos"></textarea>
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
    options.hidden = event.target.value !== "OPCION";
  });

  // Al agregar con el botón se enfoca la nueva pregunta (al cargar la página no, para que no baje sola)
  addButton.addEventListener("click", () => {
    addQuestion().querySelector(".question-text").focus();
  });

  // Las categorías son los servicios del hospital
  surveyApi("list.php")
    .then((data) => {
      categorySelect.innerHTML = data.servicios
        .map((s) => `<option value="${s.id_servicio}">${escapeHtml(s.nombre)}</option>`)
        .join("");
    })
    .catch((error) => {
      message.textContent = error.message;
    });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "";

    const preguntas = Array.from(questionList.querySelectorAll(".question-card")).map((card) => {
      const tipo = card.querySelector(".question-type").value;
      return {
        enunciado: card.querySelector(".question-text").value.trim(),
        tipo,
        opciones: tipo === "OPCION"
          ? card.querySelector(".question-options").value.split("\n").map((o) => o.trim()).filter(Boolean)
          : []
      };
    });

    const submitButtons = form.querySelectorAll("button[type=submit]");
    submitButtons.forEach((button) => { button.disabled = true; });

    try {
      await surveyApi("create.php", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: document.getElementById("titulo").value.trim(),
          descripcion: document.getElementById("descripcion").value.trim(),
          id_servicio: Number(categorySelect.value),
          estado: event.submitter?.dataset.estado || "BORRADOR",
          preguntas
        })
      });
      window.location.href = "surveys.html";
    } catch (error) {
      message.textContent = error.message;
      submitButtons.forEach((button) => { button.disabled = false; });
    }
  });

  addQuestion();
});
