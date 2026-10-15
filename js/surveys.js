// Funciones compartidas por surveys.html, survey-new.html y survey-view.html
const SURVEYS_API = "../php/surveys-";  // ej.: SURVEYS_API + "list.php" = ../php/surveys-list.php

// Llama a un PHP de encuestas y devuelve el JSON (o lanza el mensaje de error)
async function surveyApi(file, options = {}) {
  const response = await fetch(SURVEYS_API + file, {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
    ...options
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.success !== true) {
    throw new Error(data?.error?.message || "No se pudo conectar con el servidor.");
  }
  return data;
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

  let surveys = [];

  function renderStats() {
    document.getElementById("statTotal").textContent = surveys.length;
    document.getElementById("statActive").textContent = surveys.filter((s) => s.estado === "ACTIVA").length;
    document.getElementById("statAnswers").textContent = surveys
      .reduce((total, s) => total + Number(s.respuestas), 0)
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
          <span>${escapeHtml(s.servicio)} · ${s.preguntas} preguntas</span>
        </div>
        <span class="survey-status status-${s.estado.toLowerCase()}">${escapeHtml(s.estado)}</span>
        <span class="survey-answers">${s.respuestas} respuestas</span>
        <div class="survey-actions">
          ${s.estado === "ACTIVA" ? `<a href="survey-view.html?id=${s.id_encuesta}" class="survey-link">Responder</a>` : ""}
          <button type="button" class="survey-link delete-link" data-id="${s.id_encuesta}">Eliminar</button>
        </div>
      </article>
    `).join("");
  }

  function loadSurveys() {
    surveyApi("list.php")
      .then((data) => {
        surveys = data.data;
        renderStats();
        renderTable();
      })
      .catch((error) => {
        table.innerHTML = `<p class="survey-empty">${escapeHtml(error.message)}</p>`;
      });
  }

  table.addEventListener("click", async (event) => {
    const button = event.target.closest(".delete-link");
    if (!button) return;
    if (!confirm("¿Eliminar esta encuesta y todas sus respuestas?")) return;

    const body = new FormData();
    body.append("id_encuesta", button.dataset.id);
    try {
      await surveyApi("delete.php", { method: "POST", body });
      loadSurveys();
    } catch (error) {
      alert(error.message);
    }
  });

  statusFilter.addEventListener("change", renderTable);

  loadSurveys();
});
