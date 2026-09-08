document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".settings-tab");
    const panels = document.querySelectorAll(".settings-panel");
    const toggles = document.querySelectorAll(".toggle");
    const themeSwitch = document.querySelector(".theme-switch");
    const themeOptions = document.querySelectorAll(".theme-option");

    function applyTheme(theme) {
        if (!themeSwitch || (theme !== "dark" && theme !== "light")) return;

        document.documentElement.dataset.theme = theme;
        themeSwitch.dataset.theme = theme;

        themeOptions.forEach((button) => {
            const isActive = button.dataset.themeOption === theme;
            button.classList.toggle("active", isActive);
            button.setAttribute("aria-pressed", String(isActive));
        });

        try {
            localStorage.setItem("hospitalTheme", theme);
        } catch (error) {
            // The visual choice still works when browser storage is unavailable.
        }
    }

    function openTab(selectedTab) {
        const panelId = selectedTab.dataset.tab;

        tabs.forEach((tab) => {
            const isSelected = tab === selectedTab;
            tab.classList.toggle("active", isSelected);
            tab.setAttribute("aria-selected", isSelected);
            tab.tabIndex = isSelected ? 0 : -1;
        });

        panels.forEach((panel) => {
            panel.hidden = panel.id !== panelId;
        });
    }

    tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => openTab(tab));

        tab.addEventListener("keydown", (event) => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
                return;
            }

            event.preventDefault();
            const direction = event.key === "ArrowRight" ? 1 : -1;
            const nextIndex = (index + direction + tabs.length) % tabs.length;
            tabs[nextIndex].focus();
            openTab(tabs[nextIndex]);
        });
    });

    toggles.forEach((toggle) => {
        toggle.addEventListener("click", () => {
            const isOn = toggle.classList.toggle("is-on");
            toggle.setAttribute("aria-checked", isOn);
        });
    });

    themeOptions.forEach((option) => {
        option.addEventListener("click", () => {
            applyTheme(option.dataset.themeOption);
        });
    });

    applyTheme(document.documentElement.dataset.theme || "dark");

    const languageSelect = document.getElementById("settings-language");
    languageSelect?.addEventListener("change", () => languageSelect.blur());
});
