// Responder encuesta (survey-view.html?id=1). Usa getSurveys/saveSurveys de surveys.js
document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  const surveys = getSurveys();
  const id = new URLSearchParams(window.location.search).get("id");
  const survey = surveys.find((s) => String(s.id) === id) || surveys[0];
  if (!survey) return;

  const questionStep = document.getElementById("questionStep");
  const doneStep = document.getElementById("doneStep");
  const questionText = document.getElementById("questionText");
  const answerOptions = document.getElementById("answerOptions");
  const prevButton = document.getElementById("prevButton");
  const nextButton = document.getElementById("nextButton");

  const answers = [];
  let current = 0;

  document.title = survey.titulo;
  document.getElementById("surveyTitle").textContent = survey.titulo;
  document.getElementById("surveyDescription").textContent = survey.descripcion;

  function renderQuestion() {
    const question = survey.preguntas[current];
    const total = survey.preguntas.length;
    const percent = Math.round((current / total) * 100);

    document.getElementById("progressLabel").textContent = `Pregunta ${current + 1} de ${total}`;
    document.getElementById("progressPercent").textContent = `${percent}% completado`;
    document.getElementById("progressBar").style.width = `${percent}%`;
    questionText.textContent = question.texto;
    answerOptions.classList.toggle("is-rating", question.tipo === "calificacion");

    if (question.tipo === "texto") {
      answerOptions.innerHTML = '<textarea class="answer-text" placeholder="Escribí tu respuesta..."></textarea>';
      answerOptions.querySelector("textarea").value = answers[current] || "";
    } else {
      const options = question.tipo === "calificacion" ? ["1", "2", "3", "4", "5"] : question.opciones;
      answerOptions.innerHTML = options.map((option) => `
        <label class="answer-option">
          <input type="radio" name="answer" value="${escapeHtml(option)}" ${answers[current] === option ? "checked" : ""}>
          <span>${question.tipo === "calificacion" ? "★ " : ""}${escapeHtml(option)}</span>
        </label>
      `).join("");
    }

    prevButton.disabled = current === 0;
    nextButton.textContent = current === total - 1 ? "Enviar" : "Siguiente →";
  }

  function saveCurrentAnswer() {
    const text = answerOptions.querySelector("textarea");
    const checked = answerOptions.querySelector("input:checked");
    answers[current] = text ? text.value.trim() : checked?.value || "";
  }

  prevButton.addEventListener("click", () => {
    saveCurrentAnswer();
    current--;
    renderQuestion();
  });

  nextButton.addEventListener("click", () => {
    saveCurrentAnswer();
    if (current < survey.preguntas.length - 1) {
      current++;
      renderQuestion();
      return;
    }

    // Última pregunta: se suma la respuesta y se muestra el mensaje final
    survey.respuestas = (survey.respuestas || 0) + 1;
    saveSurveys(surveys);
    questionStep.hidden = true;
    doneStep.hidden = false;
  });

  renderQuestion();
});
