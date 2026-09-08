document.addEventListener('DOMContentLoaded', () => {

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


    const moreOptionsButtons = document.querySelectorAll('.more-options');

    function closeDocumentMenus() {
        document.querySelectorAll('.document-dropdown-menu.active').forEach(menu => {
            menu.classList.remove('active');
        });
        document.querySelectorAll('.more-options[aria-expanded="true"]').forEach(button => {
            button.setAttribute('aria-expanded', 'false');
        });
    }

    moreOptionsButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();

            const card = button.closest('.document-folder-card');
            const menu = card.querySelector('.document-dropdown-menu');
            const isOpen = menu.classList.contains('active');

            closeDocumentMenus();

            if (!isOpen) {
                menu.classList.add('active');
                button.setAttribute('aria-expanded', 'true');
            }
        });
    });

    document.addEventListener('click', closeDocumentMenus);

    document.querySelectorAll('.document-dropdown-menu').forEach(menu => {
        menu.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
        });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            const link = btn.closest('.document-link');
            const documentId = link?.dataset.documentId;
            window.location.href = `documents-edit.html?id=${encodeURIComponent(documentId || '1')}`;
        });
    });

    document.querySelectorAll('.select-btn').forEach(btn => {
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            const card = btn.closest('.document-folder-card');
            card.classList.toggle('selected');
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            const card = btn.closest('.document-folder-card');
            const nombre = card.querySelector('.document-name').textContent;
            if (confirm(`¿Seguro que querés eliminar "${nombre}"?`)) {
                card.closest('.document-link').remove();
            }
        });
    });

});

const prevBtn = document.getElementById('prevDocs');
const nextBtn = document.getElementById('nextDocs');
const docLinks = document.querySelectorAll('.document-link');

let currentPage = 1;

function updateDocumentPage(page) {
  currentPage = page;

  docLinks.forEach(link => {
    if (parseInt(link.dataset.page) === currentPage) {
      link.hidden = false;
    } else {
      link.hidden = true;
    }
  });

  if (prevBtn && nextBtn) {
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === 2;
  }
}

if (prevBtn && nextBtn) {
  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) updateDocumentPage(1);
  });

  nextBtn.addEventListener('click', () => {
    if (currentPage < 2) updateDocumentPage(2);
  });
}
