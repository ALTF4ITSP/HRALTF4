document.addEventListener("DOMContentLoaded", function () {

    // =====================================================
    // LISTA DE TRASLADOS
    // Este bloque funciona solamente dentro de trace.html.
    // =====================================================

    const transferGrid = document.getElementById("transferGrid");

    if (transferGrid) {
        const filterButtons = document.querySelectorAll(".filter-button");
        const transferCards = Array.from(document.querySelectorAll(".transfer-card"));
        const searchInput = document.getElementById("transferSearch");
        const resultsText = document.getElementById("resultsText");
        const emptyMessage = document.getElementById("emptyMessage");
        const pageNumbers = document.getElementById("pageNumbers");
        const previousButton = document.getElementById("previousPage");
        const nextButton = document.getElementById("nextPage");
        const newTransferButton = document.querySelector(".primary-action");

        const cardsPerPage = 3;
        let currentFilter = "active";
        let currentPage = 1;
        let searchText = "";

        const activeCards = transferCards.filter(function (card) {
            return card.dataset.status === "active";
        });

        const completedCards = transferCards.filter(function (card) {
            return card.dataset.status === "completed";
        });

        document.getElementById("activeCount").textContent = activeCards.length;
        document.getElementById("completedCount").textContent = completedCards.length;
        document.getElementById("allCount").textContent = transferCards.length;

        // Devuelve las tarjetas que coinciden con el filtro y la búsqueda.
        function getFilteredCards() {
            return transferCards.filter(function (card) {
                const matchesFilter = currentFilter === "all" || card.dataset.status === currentFilter;
                const cardText = card.textContent.toLowerCase();
                const matchesSearch = cardText.includes(searchText);

                return matchesFilter && matchesSearch;
            });
        }

        // Crea solamente los números de página que realmente se necesitan.
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

        // Muestra solamente las tarjetas de la página elegida.
        function showCurrentPage() {
            const filteredCards = getFilteredCards();
            const totalPages = Math.ceil(filteredCards.length / cardsPerPage);

            if (currentPage > totalPages && totalPages > 0) {
                currentPage = totalPages;
            }

            transferCards.forEach(function (card) {
                card.hidden = true;
            });

            const firstCard = (currentPage - 1) * cardsPerPage;
            const lastCard = firstCard + cardsPerPage;
            const cardsOnThisPage = filteredCards.slice(firstCard, lastCard);

            cardsOnThisPage.forEach(function (card) {
                card.hidden = false;
            });

            emptyMessage.hidden = filteredCards.length !== 0;
            resultsText.textContent = "Mostrando " + cardsOnThisPage.length + " de " + filteredCards.length + " traslados";

            createPageButtons(totalPages);
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
            searchText = searchInput.value.trim().toLowerCase();
            currentPage = 1;
            showCurrentPage();
        });

        previousButton.addEventListener("click", function () {
            if (currentPage > 1) {
                currentPage--;
                showCurrentPage();
            }
        });

        nextButton.addEventListener("click", function () {
            const totalPages = Math.ceil(getFilteredCards().length / cardsPerPage);

            if (currentPage < totalPages) {
                currentPage++;
                showCurrentPage();
            }
        });

        // Abre la nueva pantalla sin tener que cambiar trace.html.
        if (newTransferButton) {
            newTransferButton.addEventListener("click", function () {
                window.location.href = "trace-new.html";
            });
        }

        showCurrentPage();
    }

    // =====================================================
    // FORMULARIO DE NUEVO TRASLADO
    // Este bloque funciona solamente dentro de trace-new.html.
    // =====================================================

    const newTransferForm = document.getElementById("newTransferForm");

    if (newTransferForm) {
        const fileInput = document.getElementById("patientDocuments");
        const fileName = document.getElementById("fileName");
        const saveDraftButton = document.getElementById("saveDraft");
        const cancelButton = document.getElementById("cancelTransfer");
        const formMessage = document.getElementById("formMessage");
        const transferType = document.getElementById("transferType");
        const patientName = document.getElementById("patientName");
        const startDate = document.getElementById("startDate");
        const draftName = "hospitalNewTransferDraft";

        // Evita que se elija una fecha anterior al día actual.
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        startDate.min = year + "-" + month + "-" + day;

        function showMessage(message, isError) {
            formMessage.textContent = message;

            if (isError) {
                formMessage.classList.add("error");
            } else {
                formMessage.classList.remove("error");
            }
        }

        // El nombre del paciente es obligatorio solo para traslados de pacientes.
        function updatePatientRequirement() {
            patientName.required = transferType.value === "patient";
        }

        // Guarda los campos simples del formulario en el navegador.
        function saveDraft() {
            const draft = {};
            const controls = newTransferForm.querySelectorAll("input, select, textarea");

            controls.forEach(function (control) {
                if (!control.name || control.type === "file") {
                    return;
                }

                if (control.type === "checkbox") {
                    draft[control.name] = control.checked;
                } else {
                    draft[control.name] = control.value;
                }
            });

            try {
                localStorage.setItem(draftName, JSON.stringify(draft));
                showMessage("Borrador guardado en este navegador.", false);
            } catch (error) {
                showMessage("No se pudo guardar el borrador.", true);
            }
        }

        // Recupera el borrador cuando se vuelve a abrir la página.
        function loadDraft() {
            let savedDraft = null;

            try {
                savedDraft = localStorage.getItem(draftName);
            } catch (error) {
                return;
            }

            if (!savedDraft) {
                return;
            }

            let draft;

            try {
                draft = JSON.parse(savedDraft);
            } catch (error) {
                localStorage.removeItem(draftName);
                return;
            }

            const controls = newTransferForm.querySelectorAll("input, select, textarea");

            controls.forEach(function (control) {
                if (!control.name || control.type === "file" || draft[control.name] === undefined) {
                    return;
                }

                if (control.type === "checkbox") {
                    control.checked = draft[control.name];
                } else {
                    control.value = draft[control.name];
                }
            });

            updatePatientRequirement();
            showMessage("Se recuperó el borrador guardado.", false);
        }

        fileInput.addEventListener("change", function () {
            if (fileInput.files.length > 0) {
                fileName.textContent = fileInput.files[0].name;
            } else {
                fileName.textContent = "Buscar...";
            }
        });

        transferType.addEventListener("change", updatePatientRequirement);
        saveDraftButton.addEventListener("click", saveDraft);

        cancelButton.addEventListener("click", function () {
            try {
                localStorage.removeItem(draftName);
            } catch (error) {
                // La página puede continuar aunque el navegador bloquee el almacenamiento.
            }

            window.location.href = "trace.html";
        });

        newTransferForm.addEventListener("submit", function (event) {
            event.preventDefault();
            updatePatientRequirement();

            if (!newTransferForm.checkValidity()) {
                showMessage("Completa los campos obligatorios.", true);
                newTransferForm.reportValidity();
                return;
            }

            try {
                localStorage.removeItem(draftName);
            } catch (error) {
                // No es necesario detener el formulario por este error.
            }

            newTransferForm.reset();
            fileName.textContent = "Buscar...";
            updatePatientRequirement();
            showMessage("Traslado creado correctamente.", false);
        });

        updatePatientRequirement();
        loadDraft();
    }
});
