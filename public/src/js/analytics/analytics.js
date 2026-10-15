// Página de Reportes: pide los datos a summary.php y arma los gráficos con HTML + CSS
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // Colores de estado de las ambulancias (siempre van con su nombre en la leyenda)
  const STATUS_COLORS = {
    OPERATIVA: "#4cc878",
    EN_TRASLADO: "#7d95ec",
    MANTENIMIENTO: "#f0a040",
    FUERA_DE_SERVICIO: "#ff6b6b"
  };
  const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"];

  function escapeHtml(value) {
    const element = document.createElement("span");
    element.textContent = value ?? "";
    return element.innerHTML;
  }

  // "MANTENIMIENTO" -> "Mantenimiento", "FUERA_DE_SERVICIO" -> "Fuera de servicio"
  function prettyLabel(value) {
    const text = String(value || "").replace(/_/g, " ").toLowerCase();
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  // Barras horizontales: nombre, barra y valor
  function renderBars(containerId, rows, labelKey) {
    const container = document.getElementById(containerId);
    const total = rows.reduce((sum, row) => sum + Number(row.total), 0);

    if (!rows.length || total === 0) {
      container.innerHTML = '<p class="report-empty">Sin datos todavía.</p>';
      return;
    }

    const max = Math.max(...rows.map((row) => Number(row.total)));
    container.innerHTML = rows.map((row) => {
      const value = Number(row.total);
      const label = labelKey === "estado" ? prettyLabel(row[labelKey]) : row[labelKey];
      const percent = Math.round((value / total) * 100);
      return `
        <div class="bar-row" title="${escapeHtml(label)}: ${value} (${percent}%)">
          <span class="bar-label">${escapeHtml(label)}</span>
          <span class="bar-value">${value}</span>
          <div class="bar-track"><span style="width: ${(value / max) * 100}%"></span></div>
        </div>
      `;
    }).join("");
  }

  // Columnas de los últimos 6 meses (los meses sin datos se muestran en 0)
  function renderMonths(rows) {
    const container = document.getElementById("monthChart");
    const byMonth = Object.fromEntries(rows.map((row) => [row.mes, Number(row.total)]));
    const today = new Date();
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      months.push({ label: MONTHS[date.getMonth()], value: byMonth[key] || 0 });
    }

    const max = Math.max(1, ...months.map((month) => month.value));
    container.innerHTML = months.map((month) => `
      <div class="column" title="${month.label}: ${month.value} documentos">
        <span class="column-value">${month.value}</span>
        <div class="column-track"><span style="height: ${(month.value / max) * 100}%"></span></div>
        <span class="column-label">${month.label}</span>
      </div>
    `).join("");
  }

  // Dona hecha con conic-gradient + leyenda con nombre y cantidad
  function renderDonut(rows) {
    const donut = document.getElementById("ambulanceDonut");
    const legend = document.getElementById("ambulanceLegend");
    const total = rows.reduce((sum, row) => sum + Number(row.total), 0);

    if (!total) {
      legend.innerHTML = '<li class="report-empty">Sin ambulancias cargadas.</li>';
      return;
    }

    let start = 0;
    const slices = rows.map((row) => {
      const color = STATUS_COLORS[row.estado] || "#8a8fa8";
      const end = start + (Number(row.total) / total) * 360;
      const slice = `${color} ${start}deg ${end}deg`;
      start = end;
      return slice;
    });

    donut.style.background = `conic-gradient(${slices.join(", ")})`;
    donut.dataset.total = total;
    donut.setAttribute("aria-label", rows.map((row) => `${prettyLabel(row.estado)}: ${row.total}`).join(", "));

    legend.innerHTML = rows.map((row) => `
      <li>
        <span class="legend-dot" style="background: ${STATUS_COLORS[row.estado] || "#8a8fa8"}"></span>
        <span>${escapeHtml(prettyLabel(row.estado))}</span>
        <strong>${row.total}</strong>
      </li>
    `).join("");
  }

  function renderStats(totales) {
    const number = (value) => Number(value).toLocaleString("es-UY");
    document.getElementById("statDocuments").textContent = number(totales.documentos);
    document.getElementById("statTransfers").textContent = number(totales.traslados);
    document.getElementById("statPatients").textContent = number(totales.pacientes);
    document.getElementById("statSatisfaction").textContent = totales.satisfaccion
      ? `${String(totales.satisfaccion).replace(".", ",")} / 5`
      : "—";
  }

  fetch("../../api-connection/analytics/summary.php", { headers: { Accept: "application/json" } })
    .then((response) => response.json())
    .then((data) => {
      if (data.success !== true) throw new Error(data?.error?.message);

      const report = data.data;
      renderStats(report.totales);
      renderMonths(report.documentos_por_mes);
      renderDonut(report.ambulancias);
      renderBars("typeChart", report.documentos_por_tipo, "nombre");
      renderBars("transferChart", report.traslados, "estado");
      renderBars("surveyChart", report.encuestas, "titulo");
    })
    .catch((error) => {
      const message = document.getElementById("reportError");
      message.textContent = error.message || "No se pudieron cargar los reportes.";
      message.hidden = false;
    });
});
