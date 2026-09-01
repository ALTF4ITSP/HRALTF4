document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // DOCUMENT SEARCH BEHAVIOR
    // ==========================================
    const searchInput = document.querySelector('.search-input');
    const documentLinks = document.querySelectorAll('.document-link');

    if (searchInput && documentLinks.length) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim().toLowerCase();

            documentLinks.forEach(link => {
                link.hidden = !link.textContent.toLowerCase().includes(query);
            });
        });
    }

    // ==========================================
    // MENÚ DE 3 PUNTOS (Editar / Seleccionar / Eliminar)
    // ==========================================
    const moreOptionsButtons = document.querySelectorAll('.more-options');

    moreOptionsButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            // Evita que se dispare el link (<a>) de la tarjeta
            event.preventDefault();
            event.stopPropagation();

            const card = button.closest('.document-folder-card');
            const menu = card.querySelector('.document-dropdown-menu');
            const isOpen = menu.classList.contains('active');

            // Cierra cualquier otro menú abierto
            document.querySelectorAll('.document-dropdown-menu.active').forEach(m => {
                m.classList.remove('active');
            });
            document.querySelectorAll('.more-options[aria-expanded="true"]').forEach(b => {
                b.setAttribute('aria-expanded', 'false');
            });

            // Alterna el menú actual
            if (!isOpen) {
                menu.classList.add('active');
                button.setAttribute('aria-expanded', 'true');
            }
        });
    });

    // Cierra el menú si se hace click fuera de él
    document.addEventListener('click', () => {
        document.querySelectorAll('.document-dropdown-menu.active').forEach(m => {
            m.classList.remove('active');
        });
        document.querySelectorAll('.more-options[aria-expanded="true"]').forEach(b => {
            b.setAttribute('aria-expanded', 'false');
        });
    });

    // Evita que un click DENTRO del menú lo cierre por accidente
    document.querySelectorAll('.document-dropdown-menu').forEach(menu => {
        menu.addEventListener('click', (event) => event.stopPropagation());
    });

    // ==========================================
    // ACCIONES DEL MENÚ
    // ==========================================
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const nombre = btn.closest('.document-folder-card').querySelector('.document-name').textContent;
            console.log('Editar:', nombre);
            // Acá podés redirigir, por ejemplo:
            // window.location.href = 'documents-edit.html';
        });
    });

    document.querySelectorAll('.select-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.document-folder-card');
            card.classList.toggle('selected');
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.document-folder-card');
            const nombre = card.querySelector('.document-name').textContent;
            if (confirm(`¿Seguro que querés eliminar "${nombre}"?`)) {
                card.closest('.document-link').remove();
            }
        });
    });

});