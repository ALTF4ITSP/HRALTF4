(() => {
    let savedTheme = "dark";

    try {
        const storedTheme = localStorage.getItem("hospitalTheme");
        if (storedTheme === "light" || storedTheme === "dark") savedTheme = storedTheme;
    } catch (error) {
        // Storage can be unavailable in private or restricted browsing contexts.
    }

    document.documentElement.dataset.theme = savedTheme;
})();

document.addEventListener('DOMContentLoaded', () => {

    const userNameTargets = document.querySelectorAll('[data-current-user-name]');
    const welcomeTargets = document.querySelectorAll('[data-current-user-welcome]');
    const userAvatarTargets = document.querySelectorAll('[data-current-user-avatar]');

    if (userNameTargets.length || welcomeTargets.length || userAvatarTargets.length) {
        const script = document.querySelector('script[src*="js/main-menu.js"]');

        if (script) {
            const endpoint = new URL('../../api/settings_get.php', script.src);

            fetch(endpoint, { credentials: 'same-origin' })
                .then(response => response.json().then(data => ({ response, data })))
                .then(({ response, data }) => {
                    if (!response.ok || data.success !== true) return;

                    const user = data.data?.usuario || {};
                    const fullName = user.nombre_completo || user.nombre_usuario || 'Usuario';
                    const firstName = user.nombre || fullName;

                    userNameTargets.forEach(element => {
                        element.textContent = fullName;
                    });

                    welcomeTargets.forEach(element => {
                        element.textContent = `¡Bienvenido ${firstName}!`;
                    });

                    userAvatarTargets.forEach(element => {
                        element.alt = fullName;
                    });
                })
                .catch(() => {
                    // Keep the HTML placeholders if the user data cannot be loaded.
                });
        }
    }

    const searchBtn = document.querySelector('.search-action');
    const topbar = document.querySelector('.topbar');
    const searchInput = document.querySelector('.search-input');

    if (searchBtn && topbar && searchInput) {
        searchBtn.addEventListener('click', () => {
            topbar.classList.toggle('search-active');
            searchBtn.setAttribute('aria-expanded', String(topbar.classList.contains('search-active')));

            if (topbar.classList.contains('search-active')) {
                setTimeout(() => searchInput.focus(), 400);
            } else {
                searchInput.value = '';
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
    }

    const profileWrapper = document.querySelector('.profile-wrapper');
    const profileBtn = document.querySelector('.profile-button');

    if (profileWrapper && profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileWrapper.classList.toggle('profile-active');
            profileBtn.setAttribute('aria-expanded', String(profileWrapper.classList.contains('profile-active')));
        });

        document.addEventListener('click', (e) => {
            if (!profileWrapper.contains(e.target)) {
                profileWrapper.classList.remove('profile-active');
                profileBtn.setAttribute('aria-expanded', 'false');
            }
        });
    }

    const appShell = document.querySelector('.app-shell');
    const menuBtn = document.querySelector('.sidebar-action');
    const navItems = document.querySelectorAll('.nav-item');
    const sidebarNav = document.querySelector('.sidebar-nav');
    const indicator = document.querySelector('.nav-indicator');

    function updateIndicator(item) {
        if (!indicator || !sidebarNav || !item) return;
        const topPos = item.offsetTop;
        sidebarNav.style.setProperty('--indicator-top', `${topPos}px`);
    }

    if (menuBtn && appShell) {
        menuBtn.addEventListener('click', () => {
            appShell.classList.toggle('menu-open');
            menuBtn.setAttribute('aria-expanded', String(appShell.classList.contains('menu-open')));
        });
    }

    // Keep indicator aligned on window resize
    window.addEventListener('resize', () => {
        const activeItem = document.querySelector('.nav-item.active');
        if (activeItem) updateIndicator(activeItem);
    });

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const href = item.getAttribute('href');

            if (!href || href === '#') e.preventDefault();

            document.querySelector('.nav-item.active')?.classList.remove('active');
            item.classList.add('active');

            // Animates smoothly to the clicked item
            updateIndicator(item);
        });
    });

    // Position immediately on load without animation
    const activeStart = document.querySelector('.nav-item.active');
    if (activeStart) {
        updateIndicator(activeStart);
    }

});
