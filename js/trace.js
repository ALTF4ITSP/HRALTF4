// Traslados de ambulancias: lista (trace.html) y formulario nuevo/editar (trace-new.html).
// Los datos vienen de php/traslados.php
const TRASLADOS_API = "../php/traslados.php";

const TIPO_TEXTO = { PACIENTE: "Paciente", EQUIPO: "Equipo", BIOLOGICO: "Biológico" };
const TIPO_COLOR = { PACIENTE: "blue-card", EQUIPO: "green-card", BIOLOGICO: "purple-card" };
const TIPO_ICONO = { PACIENTE: "human-icon.svg", EQUIPO: "medkit-icon.png", BIOLOGICO: "biohazard-icon.svg" };
const ESTADO_TEXTO = { ASIGNADO: "ASIGNADO", EN_CURSO: "EN CURSO", EN_DESTINO: "EN DESTINO", FINALIZADO: "FINALIZADO", CANCELADO: "CANCELADO" };
const ESTADO_CLASE = { ASIGNADO: "assigned-label", EN_CURSO: "progress-label", EN_DESTINO: "progress-label", FINALIZADO: "completed-label", CANCELADO: "completed-label" };
const ACTIVOS = ["ASIGNADO", "EN_CURSO", "EN_DESTINO"];

async function trasladosApi(query = "", options = {}) {
    const response = await fetch(TRASLADOS_API + query, {
        credentials: "same-origin",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
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

// "2026-10-15T09:30" → "15/10/2026 · 9:30 AM" (el orden por fecha de la lista lee este formato)
function fechaHora(valor) {
    if (!valor) return "—";
    const [fecha, hora] = valor.split("T");
    const [anio, mes, dia] = fecha.split("-");
    let [h, m] = hora.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${dia}/${mes}/${anio} · ${h}:${String(m).padStart(2, "0")} ${ampm}`;
}

function tarjetaTraslado(t) {
    const activo = ACTIVOS.includes(t.estado);
    return `
        <article class="transfer-card ${TIPO_COLOR[t.tipo]}" data-status="${activo ? "active" : "completed"}">
            <div class="card-heading">
                <div class="ambulance-icon">
                    <img src="../imagenes/ambulance-icon.png" alt="" aria-hidden="true">
                </div>
                <div class="card-title">
                    <h2>TRASLADO ${t.id}</h2>
                    <p>Ambulancia ${escapeHtml(t.matricula)}</p>
                </div>
                <span class="status-label ${ESTADO_CLASE[t.estado]}">${ESTADO_TEXTO[t.estado]}</span>
            </div>

            <div class="card-divider"></div>

            <div class="transfer-information">
                <div class="info-group">
                    <p class="information-label">Conductor</p>
                    <div class="info-value">
                        <img src="../imagenes/steering-wheel.svg" alt="" aria-hidden="true" class="info-icon">
                        <p>${escapeHtml(t.chofer)}</p>
                    </div>
                </div>
                <div class="info-group">
                    <p class="information-label">Acompañante</p>
                    <div class="info-value">
                        <img src="../imagenes/person-icon.svg" alt="" aria-hidden="true" class="info-icon">
                        <p>${escapeHtml(t.acompanante || "—")}</p>
                    </div>
                </div>
                <div class="info-group">
                    <p class="information-label">Elemento</p>
                    <div class="info-value">
                        <img src="../imagenes/${TIPO_ICONO[t.tipo]}" alt="" aria-hidden="true" class="info-icon">
                        <p>${TIPO_TEXTO[t.tipo]}</p>
                    </div>
                </div>
            </div>

            <div class="route-box">
                <div class="route-line"><span></span><span></span></div>
                <div class="route-text">
                    <div><small>Origen</small><strong>${escapeHtml(t.origen)}</strong>
                        <p>${fechaHora(t.fecha_salida)}</p>
                    </div>
                    <div><small>Destino</small><strong>${escapeHtml(t.destino)}</strong>
                        <p>${t.llegada_estimada ? "ETA " + fechaHora(t.llegada_estimada) : "Sin hora estimada"}</p>
                    </div>
                </div>
            </div>

            <button type="button" class="details-button"
                onclick="window.location.href='trace-view.html?id=${t.id}';">Ver detalles</button>
        </article>`;
}

document.addEventListener("DOMContentLoaded", async function () {

    const transferGrid = document.getElementById("transferGrid");

    if (transferGrid) {
        // Primero se arman las tarjetas con los traslados de la base; el resto del código las usa
        try {
            const { data } = await trasladosApi();
            transferGrid.innerHTML = data.map(tarjetaTraslado).join("");
        } catch (error) {
            document.getElementById("emptyMessage").textContent = error.message;
        }
        const filterButtons = document.querySelectorAll(".filter-button");
        const transferCards = Array.from(document.querySelectorAll(".transfer-card"));
        const allTransfers = document.getElementById("allTransfers");
        const transferList = document.getElementById("transferList");
        const contentCard = document.querySelector(".content-card");
        const searchInput = document.getElementById("listTransferSearch");
        const typeButtons = Array.from(document.querySelectorAll("[data-type]"));
        const sortButtons = Array.from(document.querySelectorAll("[data-sort]"));
        const resultsText = document.getElementById("resultsText");
        const emptyMessage = document.getElementById("emptyMessage");
        const listEmptyMessage = document.getElementById("listEmptyMessage");
        const pageNumbers = document.getElementById("pageNumbers");
        const previousButton = document.getElementById("previousPage");
        const nextButton = document.getElementById("nextPage");
        const newTransferButton = document.querySelector(".primary-action");

        let currentFilter = "active";
        let currentPage = 1;
        let searchText = "";
        let currentType = "all";
        let dateOrder = "newest";

        function normalize(value) {
            return value.toLowerCase().normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, " ")
                .trim();
        }

        function originTimestamp(card) {
            const dateText = card.querySelector(".route-text > div:first-child p")?.textContent || "";
            const parts = dateText.match(/(\d{1,2})\/(\d{1,2})\/(\d{4}).*?(\d{1,2}):(\d{2})\s*(AM|PM)/i);
            if (!parts) return 0;
            let hour = Number(parts[4]) % 12;
            if (parts[6].toUpperCase() === "PM") hour += 12;
            return new Date(Number(parts[3]), Number(parts[2]) - 1, Number(parts[1]), hour, Number(parts[5])).getTime();
        }

        // The cards remain the single source of transfer details for both views.
        const transfers = transferCards.map(function (card, index) {
            const type = card.querySelector(".transfer-information .info-group:last-child .info-value p")?.textContent || "";
            return {
                card,
                index,
                type: normalize(type),
                timestamp: originTimestamp(card),
                keywords: normalize(card.textContent)
            };
        });

        const activeCards = transferCards.filter(function (card) {
            return card.dataset.status === "active";
        });

        const completedCards = transferCards.filter(function (card) {
            return card.dataset.status === "completed";
        });

        document.getElementById("activeCount").textContent = activeCards.length;
        document.getElementById("completedCount").textContent = completedCards.length;
        document.getElementById("allCount").textContent = transferCards.length;

        function getFilteredCards() {
            return transferCards.filter(function (card) {
                return card.dataset.status === currentFilter;
            });
        }

        function getFilteredTransfers() {
            const words = normalize(searchText).split(" ").filter(Boolean);
            return transfers.filter(function (transfer) {
                return (currentType === "all" || transfer.type === currentType) &&
                    words.every(function (word) { return transfer.keywords.includes(word); });
            }).sort(function (first, second) {
                const difference = dateOrder === "newest"
                    ? second.timestamp - first.timestamp
                    : first.timestamp - second.timestamp;
                return difference || first.index - second.index;
            });
        }

        function makeListRow(transfer) {
            const card = transfer.card;
            const row = document.createElement("article");
            row.className = "transfer-list-row " + ["blue-card", "green-card", "purple-card"]
                .find(function (name) { return card.classList.contains(name); });

            const identity = document.createElement("div");
            identity.className = "list-row-identity";
            identity.appendChild(card.querySelector(".ambulance-icon").cloneNode(true));
            const identityCopy = document.createElement("div");
            identityCopy.className = "list-row-identity-copy";
            identityCopy.appendChild(card.querySelector(".card-title").cloneNode(true));
            const badges = document.createElement("div");
            badges.className = "list-row-badges";
            badges.appendChild(card.querySelector(".status-label").cloneNode(true));
            const typeBadge = document.createElement("span");
            typeBadge.className = "list-type-badge";
            typeBadge.textContent = "Elemento: " +
                (card.querySelector(".transfer-information .info-group:last-child .info-value p")?.textContent || "");
            badges.appendChild(typeBadge);
            identityCopy.appendChild(badges);
            identity.appendChild(identityCopy);

            const route = document.createElement("div");
            route.className = "list-row-route";
            route.appendChild(card.querySelector(".route-box").cloneNode(true));

            const crew = document.createElement("div");
            crew.className = "list-row-crew";
            const information = card.querySelector(".transfer-information").cloneNode(true);
            information.querySelector(".info-group:last-child").remove();
            crew.appendChild(information);

            const action = document.createElement("div");
            action.className = "list-row-action";
            action.appendChild(card.querySelector(".details-button").cloneNode(true));
            row.append(identity, route, crew, action);
            return row;
        }

        function createPageButtons(totalPages) {
            pageNumbers.innerHTML = "";

            previousButton.disabled = currentPage === 1 || totalPages === 0;
            nextButton.disabled = currentPage === totalPages || totalPages === 0;

            let firstPage = 1;
            let lastPage = Math.min(3, totalPages);

            if (totalPages > 3 && currentPage > 2) {
                firstPage = currentPage - 1;
                lastPage = currentPage + 1;
            }

            if (lastPage > totalPages) {
                lastPage = totalPages;
                firstPage = Math.max(1, lastPage - 2);
            }

            for (let page = firstPage; page <= lastPage; page++) {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "page-button";
                button.textContent = page;
                button.setAttribute("aria-label", "Ir a la página " + page);

                if (page === currentPage) {
                    button.classList.add("active");
                    button.setAttribute("aria-current", "page");
                }

                button.addEventListener("click", function () {
                    currentPage = page;
                    showCurrentPage();
                });

                pageNumbers.appendChild(button);
            }
        }

        function showCurrentPage() {
            const isListView = currentFilter === "all";
            const filteredItems = isListView ? getFilteredTransfers() : getFilteredCards();
            const cardsPerPage = 3;
            const totalPages = isListView ? 0 : Math.ceil(filteredItems.length / cardsPerPage);

            if (currentPage > totalPages && totalPages > 0) {
                currentPage = totalPages;
            }

            transferGrid.hidden = isListView;
            allTransfers.hidden = !isListView;
            contentCard.classList.toggle("all-view-active", isListView);
            transferCards.forEach(function (card) {
                card.hidden = true;
            });

            const firstItem = (currentPage - 1) * cardsPerPage;
            const itemsOnThisPage = isListView
                ? filteredItems
                : filteredItems.slice(firstItem, firstItem + cardsPerPage);

            if (isListView) {
                transferList.replaceChildren(...itemsOnThisPage.map(makeListRow));
                transferList.hidden = filteredItems.length === 0;
                transferList.scrollTop = 0;
            } else {
                itemsOnThisPage.forEach(function (card) { card.hidden = false; });
            }

            emptyMessage.hidden = isListView || filteredItems.length !== 0;
            listEmptyMessage.hidden = !isListView || filteredItems.length !== 0;
            resultsText.textContent = isListView
                ? filteredItems.length + (filteredItems.length === 1 ? " traslado" : " traslados")
                : "Mostrando " + itemsOnThisPage.length + " de " + filteredItems.length + " traslados";

            if (!isListView) createPageButtons(totalPages);
        }

        filterButtons.forEach(function (button) {
            button.addEventListener("click", function () {
                filterButtons.forEach(function (otherButton) {
                    otherButton.classList.remove("active");
                    otherButton.setAttribute("aria-selected", "false");
                });

                button.classList.add("active");
                button.setAttribute("aria-selected", "true");

                currentFilter = button.dataset.filter;
                currentPage = 1;
                showCurrentPage();
            });
        });

        searchInput.addEventListener("input", function () {
            searchText = searchInput.value;
            currentPage = 1;
            if (currentFilter === "all") showCurrentPage();
        });

        typeButtons.forEach(function (button) {
            button.addEventListener("click", function () {
                typeButtons.forEach(function (otherButton) {
                    otherButton.classList.toggle("active", otherButton === button);
                    otherButton.setAttribute("aria-pressed", String(otherButton === button));
                });
                currentType = button.dataset.type;
                currentPage = 1;
                showCurrentPage();
            });
        });

        sortButtons.forEach(function (button) {
            button.addEventListener("click", function () {
                sortButtons.forEach(function (otherButton) {
                    otherButton.classList.toggle("active", otherButton === button);
                    otherButton.setAttribute("aria-pressed", String(otherButton === button));
                });
                dateOrder = button.dataset.sort;
                currentPage = 1;
                showCurrentPage();
            });
        });

        previousButton.addEventListener("click", function () {
            if (currentPage > 1) {
                currentPage--;
                showCurrentPage();
            }
        });

        nextButton.addEventListener("click", function () {
            const totalPages = Math.ceil(getFilteredCards().length / 3);

            if (currentPage < totalPages) {
                currentPage++;
                showCurrentPage();
            }
        });

        if (newTransferButton) {
            newTransferButton.addEventListener("click", function () {
                window.location.href = "trace-new.html";
            });
        }

        showCurrentPage();
    }

    const newTransferForm = document.getElementById("newTransferForm");

    if (newTransferForm) {
        const saveDraftButton = document.getElementById("saveDraft");
        const cancelButton = document.getElementById("cancelTransfer");
        const formMessage = document.getElementById("formMessage");
        // Buscador de pacientes (js/buscador.js)
        const patientSearch = crearBuscador(document.getElementById("patient"), { texto: p => `${p.nombre} · CI ${p.documento}` });
        const editId = new URLSearchParams(window.location.search).get("id");
        const draftName = "hospitalNewTransferDraft";
        const opcionesExtra = ["specialEquipment", "withFamily", "interdepartmental", "criticalPatient"];

        function showMessage(message, isError) {
            formMessage.textContent = message;
            formMessage.classList.toggle("error", Boolean(isError));
        }

        function fillSelect(id, items, label, firstOption) {
            document.getElementById(id).innerHTML = `<option value="">${firstOption}</option>` +
                items.map(item => `<option value="${item.id}">${escapeHtml(label(item))}</option>`).join("");
        }

        // El texto de cada casilla de "Opciones adicionales"
        const optionLabel = name => newTransferForm.elements[name].closest("label").textContent.trim();

        // Borrador: solo para traslados nuevos, se guarda en este navegador
        function saveDraft() {
            const draft = {};
            newTransferForm.querySelectorAll("input, select, textarea").forEach(function (control) {
                if (!control.name) return;
                draft[control.name] = control.type === "checkbox" ? control.checked : control.value;
            });
            try {
                localStorage.setItem(draftName, JSON.stringify(draft));
                showMessage("Borrador guardado en este navegador.", false);
            } catch (error) {
                showMessage("No se pudo guardar el borrador.", true);
            }
        }

        function loadDraft() {
            let draft;
            try {
                draft = JSON.parse(localStorage.getItem(draftName) || "null");
            } catch (error) {
                return;
            }
            if (!draft) return;
            newTransferForm.querySelectorAll("input, select, textarea").forEach(function (control) {
                if (!control.name || draft[control.name] === undefined) return;
                if (control.type === "checkbox") control.checked = draft[control.name];
                else control.value = draft[control.name];
            });
            patientSearch.setValue(newTransferForm.elements.id_gestion_paciente.value);
            showMessage("Se recuperó el borrador guardado.", false);
        }

        function fillForm(t) {
            const f = newTransferForm.elements;
            ["id_ambulancia", "id_chofer", "id_acompanante", "id_origen", "id_destino"]
                .forEach(name => { f[name].value = t[name] ?? ""; });
            patientSearch.setValue(t.id_gestion_paciente);
            f.reason.value = t.motivo;
            f.tipo.value = t.tipo;
            f.prioridad.value = t.prioridad;
            f.notas.value = t.notas ?? "";
            [f.startDate.value, f.startTime.value] = t.fecha_salida.split("T");
            f.etaTime.value = t.llegada_estimada ? t.llegada_estimada.split("T")[1] : "";
            const marcadas = (t.opciones || "").split(", ");
            opcionesExtra.forEach(name => { f[name].checked = marcadas.includes(optionLabel(name)); });
        }

        async function init() {
            try {
                const { data } = await trasladosApi("?opciones=1");
                const estadoAmbulancia = { OPERATIVA: "", MANTENIMIENTO: " (en mantenimiento)", FUERA_SERVICIO: " (fuera de servicio)" };
                fillSelect("ambulance", data.ambulancias, a => `${a.matricula} · ${a.modelo}${estadoAmbulancia[a.estado_operativo] ?? ""}`, "Elegir ambulancia...");
                fillSelect("driver", data.personal, p => `${p.nombre} (${p.rol})`, "Elegir conductor...");
                fillSelect("companion", data.personal, p => `${p.nombre} (${p.rol})`, "Sin acompañante");
                fillSelect("origin", data.destinos, d => `${d.nombre} · ${d.localidad}`, "Elegir origen...");
                fillSelect("destination", data.destinos, d => `${d.nombre} · ${d.localidad}`, "Elegir destino...");
                patientSearch.setItems(data.pacientes);

                if (editId) {
                    document.getElementById("formTitle").textContent = `Editar Traslado ${editId}`;
                    document.title = `Editar Traslado ${editId}`;
                    document.getElementById("submitTransfer").textContent = "Guardar Cambios";
                    saveDraftButton.hidden = true;
                    fillForm((await trasladosApi(`?id=${encodeURIComponent(editId)}`)).data);
                } else {
                    const today = new Date();
                    newTransferForm.elements.startDate.min =
                        `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
                    loadDraft();
                }
            } catch (error) {
                showMessage(error.message, true);
            }
        }

        saveDraftButton.addEventListener("click", saveDraft);

        cancelButton.addEventListener("click", function () {
            if (!editId) {
                try { localStorage.removeItem(draftName); } catch (error) { /* sin almacenamiento */ }
            }
            window.location.href = editId ? `trace-view.html?id=${editId}` : "trace.html";
        });

        newTransferForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            if (!newTransferForm.checkValidity()) {
                showMessage("Completa los campos obligatorios.", true);
                newTransferForm.reportValidity();
                return;
            }

            const f = newTransferForm.elements;
            if (f.tipo.value === "PACIENTE" && !f.id_gestion_paciente.value) {
                showMessage("Buscá y elegí el paciente de la lista.", true);
                document.getElementById("patient").focus();
                return;
            }
            const traslado = {
                id: editId,
                id_ambulancia: f.id_ambulancia.value,
                id_chofer: f.id_chofer.value,
                id_acompanante: f.id_acompanante.value,
                id_origen: f.id_origen.value,
                id_destino: f.id_destino.value,
                id_gestion_paciente: f.id_gestion_paciente.value,
                tipo: f.tipo.value,
                motivo: f.reason.value,
                prioridad: f.prioridad.value,
                fecha_salida: `${f.startDate.value}T${f.startTime.value}`,
                llegada_estimada: f.etaTime.value ? `${f.startDate.value}T${f.etaTime.value}` : "",
                opciones: opcionesExtra.filter(name => f[name].checked).map(optionLabel).join(", "),
                notas: f.notas.value
            };

            try {
                const { id } = await trasladosApi("", {
                    method: "POST",
                    body: JSON.stringify({ accion: "guardar", traslado })
                });
                try { localStorage.removeItem(draftName); } catch (error) { /* sin almacenamiento */ }
                window.location.href = `trace-view.html?id=${id}`;
            } catch (error) {
                showMessage(error.message, true);
            }
        });

        init();
    }
});
