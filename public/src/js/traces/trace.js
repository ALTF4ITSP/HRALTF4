document.addEventListener("DOMContentLoaded", function () {

    const transferGrid = document.getElementById("transferGrid");

    if (transferGrid) {
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
        const transferType = document.getElementById("transferType");
        const patientName = document.getElementById("patientName");
        const startDate = document.getElementById("startDate");
        const draftName = "hospitalNewTransferDraft";

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

        function updatePatientRequirement() {
            patientName.required = transferType.value === "patient";
        }

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

        transferType.addEventListener("change", updatePatientRequirement);
        saveDraftButton.addEventListener("click", saveDraft);

        cancelButton.addEventListener("click", function () {
            try {
                localStorage.removeItem(draftName);
            } catch (error) {

            }

            window.location.href = "trace.html";
        });

        newTransferForm.addEventListener("invalid", function () {
            showMessage("Completa los campos obligatorios y revisa los valores indicados.", true);
        }, true);

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
            }

            newTransferForm.reset();
            updatePatientRequirement();
            showMessage("Traslado creado correctamente.", false);
        });

        updatePatientRequirement();
        loadDraft();
    }
});
