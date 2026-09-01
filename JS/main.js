document.addEventListener('DOMContentLoaded', () => {

    const searchBtn = document.querySelector('.search-action');
    const topbar = document.querySelector('.topbar');
    const searchInput = document.querySelector('.search-input');

    if (searchBtn && topbar && searchInput) {
        searchBtn.addEventListener('click', () => {
            topbar.classList.toggle('search-active');
            
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
        });

        document.addEventListener('click', (e) => {
            if (!profileWrapper.contains(e.target)) {
                profileWrapper.classList.remove('profile-active');
            }
        });
    }

    const appShell = document.querySelector('.app-shell');
    const menuBtn = document.querySelector('.sidebar-action');
    const navItems = document.querySelectorAll('.nav-item');
    const sidebarNav = document.querySelector('.sidebar-nav');
    const indicator = document.querySelector('.nav-indicator');

    if (menuBtn && appShell) {
        menuBtn.addEventListener('click', () => {
            appShell.classList.toggle('menu-open');
            
            if (appShell.classList.contains('menu-open')) {
                const activeItem = document.querySelector('.nav-item.active');
                if (activeItem) updateIndicator(activeItem);
            }
        });
    }

    function updateIndicator(item) {
        if (!indicator || !sidebarNav) return;
        
        const topPos = item.offsetTop; 
        
        sidebarNav.style.setProperty('--indicator-top', `${topPos}px`);
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const href = item.getAttribute('href');

            if (!href || href === '#') e.preventDefault();
            
            document.querySelector('.nav-item.active')?.classList.remove('active');
            item.classList.add('active');
            
            updateIndicator(item);
        });
    });

    setTimeout(() => {
        const activeStart = document.querySelector('.nav-item.active');
        if (activeStart) updateIndicator(activeStart);
    }, 100);

});
