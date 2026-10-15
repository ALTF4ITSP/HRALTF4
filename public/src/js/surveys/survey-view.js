// Responder encuesta (survey-view.html?id=1). Usa surveyApi de surveys.js
document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  const id = new URLSearchParams(window.location.search).get("id");

  const questionStep = document.getElementById("questionStep");
  const doneStep = document.getElementById("doneStep");
  const questionText = document.getElementById("questionText");
  const answerOptions = document.getElementById("answerOptions");
  const answerMessage = document.getElementById("answerMessage");
  const prevButton = document.getElementById("prevButton");
  const nextButton = document.getElementById("nextButton");

  let survey = null;
  const answers = {};
  let current = 0;

  function optionsFor(question) {
    if (question.tipo === "ESCALA") return ["1", "2", "3", "4", "5"];
    if (question.tipo === "SI_NO") return ["Sí", "No"];
    return question.opciones;
  }

  function renderQuestion() {
    const question = survey.preguntas[current];
    const total = survey.preguntas.length;
    const percent = Math.round((current / total) * 100);
    const saved = answers[question.id_pregunta] || "";

    document.getElementById("progressLabel").textContent = `Pregunta ${current + 1} de ${total}`;
    document.getElementById("progressPercent").textContent = `${percent}% completado`;
    document.getElementById("progressBar").style.width = `${percent}%`;
    questionText.textContent = question.enunciado;
    answerMessage.textContent = "";
    answerOptions.classList.toggle("is-rating", question.tipo === "ESCALA");

    if (question.tipo === "TEXTO") {
      answerOptions.innerHTML = '<textarea class="answer-text" maxlength="1000" placeholder="Escribí tu respuesta..."></textarea>';
      answerOptions.querySelector("textarea").value = saved;
    } else {
      answerOptions.innerHTML = optionsFor(question).map((option) => `
        <label class="answer-option">
          <input type="radio" name="answer" value="${escapeHtml(option)}" ${saved === option ? "checked" : ""}>
          <span>${question.tipo === "ESCALA" ? "★ " : ""}${escapeHtml(option)}</span>
        </label>
      `).join("");
    }

    prevButton.disabled = current === 0;
    nextButton.textContent = current === total - 1 ? "Enviar" : "Siguiente →";
  }

  function saveCurrentAnswer() {
    const question = survey.preguntas[current];
    const text = answerOptions.querySelector("textarea");
    const checked = answerOptions.querySelector("input:checked");
    answers[question.id_pregunta] = text ? text.value.trim() : checked?.value || "";
    return answers[question.id_pregunta];
  }

  prevButton.addEventListener("click", () => {
    saveCurrentAnswer();
    current--;
    renderQuestion();
  });

  nextButton.addEventListener("click", async () => {
    const value = saveCurrentAnswer();
    if (!value && Number(survey.preguntas[current].obligatoria) === 1) {
      answerMessage.textContent = "Esta pregunta es obligatoria.";
      return;
    }

    if (current < survey.preguntas.length - 1) {
      current++;
      renderQuestion();
      return;
    }

    // Última pregunta: se envían todas las respuestas
    nextButton.disabled = true;
    try {
      await surveyApi("answer.php", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ id_encuesta: survey.id_encuesta, respuestas: answers })
      });
      questionStep.hidden = true;
      doneStep.hidden = false;
    } catch (error) {
      answerMessage.textContent = error.message;
      nextButton.disabled = false;
    }
  });

  surveyApi(`get.php?id=${encodeURIComponent(id || "")}`)
    .then((data) => {
      survey = data.data;
      document.title = survey.titulo;
      document.getElementById("surveyTitle").textContent = survey.titulo;
      document.getElementById("surveyDescription").textContent = survey.descripcion || "";

      if (survey.estado !== "ACTIVA" || !survey.preguntas.length) {
        questionStep.innerHTML = '<p class="answer-message">Esta encuesta no está disponible en este momento.</p>';
        return;
      }
      renderQuestion();
    })
    .catch((error) => {
      document.getElementById("surveyTitle").textContent = "Encuesta no disponible";
      questionStep.innerHTML = `<p class="answer-message">${escapeHtml(error.message)}</p>`;
    });
});
