document.addEventListener("DOMContentLoaded", function () {

    // =====================================================
    // FILTROS, BÚSQUEDA Y PAGINACIÓN
    // =====================================================

    const filterButtons = document.querySelectorAll(".filter-button");
    const transferCards = Array.from(document.querySelectorAll(".transfer-card"));
    const searchInput = document.getElementById("transferSearch");
    const resultsText = document.getElementById("resultsText");
    const emptyMessage = document.getElementById("emptyMessage");
    const pageNumbers = document.getElementById("pageNumbers");
    const previousButton = document.getElementById("previousPage");
    const nextButton = document.getElementById("nextPage");

    const cardsPerPage = 3;
    let currentFilter = "active";
    let currentPage = 1;
    let searchText = "";

    // Actualiza los pequeños números de cada filtro.
    const activeCards = transferCards.filter(function (card) {
        return card.dataset.status === "active";
    });

    const completedCards = transferCards.filter(function (card) {
        return card.dataset.status === "completed";
    });

    document.getElementById("activeCount").textContent = activeCards.length;
    document.getElementById("completedCount").textContent = completedCards.length;
    document.getElementById("allCount").textContent = transferCards.length;

    // Devuelve solamente las tarjetas que coinciden con el filtro y la búsqueda.
    function getFilteredCards() {
        return transferCards.filter(function (card) {
            const matchesFilter = currentFilter === "all" || card.dataset.status === currentFilter;
            const cardText = card.textContent.toLowerCase();
            const matchesSearch = cardText.includes(searchText);

            return matchesFilter && matchesSearch;
        });
    }

    // Crea los botones numéricos. Se muestran hasta tres números a la vez.
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

    // Oculta todas las tarjetas y muestra solamente las de la página elegida.
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

    // Cambia entre Activos, Completados y Todos.
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

    // Busca por número, ambulancia, persona, elemento u origen/destino.
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

    // Muestra la primera página al cargar el sitio.
    showCurrentPage();
});
