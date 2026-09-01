document.addEventListener("DOMContentLoaded", function () {
  const appShell = document.querySelector(".app-shell");
  const menuButton = document.querySelector(".sidebar-action");
  const sidebarNav = document.querySelector(".sidebar-nav");
  const indicator = document.querySelector(".nav-indicator");
  const navItems = document.querySelectorAll(".nav-item");

  function moveIndicator(item) {
    if (!item || !sidebarNav || !indicator) return;
    sidebarNav.style.setProperty("--indicator-top", item.offsetTop + "px");
  }

  if (menuButton && appShell) {
    menuButton.addEventListener("click", function () {
      appShell.classList.toggle("menu-open");

      if (appShell.classList.contains("menu-open")) {
        setTimeout(function () {
          moveIndicator(document.querySelector(".nav-item.active"));
        }, 120);
      }
    });
  }

  navItems.forEach(function (item) {
    item.addEventListener("click", function (event) {
      const href = item.getAttribute("href");

      if (!href || href === "#") event.preventDefault();
      const currentActive = document.querySelector(".nav-item.active");
      if (currentActive) currentActive.classList.remove("active");
      item.classList.add("active");
      moveIndicator(item);
    });
  });

  setTimeout(function () {
    moveIndicator(document.querySelector(".nav-item.active"));
  }, 100);

  const generalForm = document.getElementById("general-form");
  if (generalForm) {
    generalForm.addEventListener("submit", function (event) {
      event.preventDefault();
    });
  }

  const tabButtons = document.querySelectorAll(".tab-button");
  const tabPanels = document.querySelectorAll(".tab-panel");

  tabButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const panelId = button.dataset.tab;

      tabButtons.forEach(function (tab) {
        tab.classList.remove("active");
        tab.setAttribute("aria-selected", "false");
      });

      tabPanels.forEach(function (panel) {
        panel.hidden = true;
      });

      button.classList.add("active");
      button.setAttribute("aria-selected", "true");
      document.getElementById(panelId).hidden = false;
    });
  });

  const switches = document.querySelectorAll(".switch");

  switches.forEach(function (toggle) {
    toggle.addEventListener("click", function () {
      toggle.classList.toggle("is-on");
      toggle.setAttribute("aria-pressed", toggle.classList.contains("is-on"));
    });
  });

  const photoInput = document.getElementById("profile-photo");
  const photoPreview = document.getElementById("photo-preview");
  const uploadBox = document.querySelector(".upload-box");
  const uploadText = document.getElementById("upload-text");

  if (photoInput && photoPreview && uploadBox) {
    photoInput.addEventListener("change", function () {
      const file = photoInput.files[0];
      if (!file) return;

      const reader = new FileReader();

      reader.addEventListener("load", function () {
        photoPreview.src = reader.result;
        uploadBox.classList.add("has-image");
        uploadText.textContent = "CAMBIAR IMAGEN";
      });

      reader.readAsDataURL(file);
    });
  }

  const addSpecialty = document.getElementById("add-specialty");
  const specialtiesList = document.getElementById("specialties-list");

  if (addSpecialty && specialtiesList) {
    addSpecialty.addEventListener("click", function () {
      const name = prompt("Escribí la especialización:");
      if (!name || !name.trim()) return;

      const tag = document.createElement("span");
      tag.className = "specialty-tag";
      tag.textContent = name.trim();
      specialtiesList.insertBefore(tag, addSpecialty);
    });
  }

  const themeButtons = document.querySelectorAll(".theme-option");

  themeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      themeButtons.forEach(function (option) {
        option.classList.remove("active");
      });

      button.classList.add("active");
      document.body.classList.toggle("light-mode", button.dataset.theme === "light");
    });
  });

  const profileArea = document.querySelector(".profile-area");
  const profileButton = document.querySelector(".profile-summary");

  if (profileArea && profileButton) {
    profileButton.addEventListener("click", function (event) {
      event.stopPropagation();
      profileArea.classList.toggle("open");
      profileButton.setAttribute("aria-expanded", profileArea.classList.contains("open"));
    });

    document.addEventListener("click", function (event) {
      if (!profileArea.contains(event.target)) {
        profileArea.classList.remove("open");
        profileButton.setAttribute("aria-expanded", "false");
      }
    });
  }

  const resetButton = document.getElementById("reset-password");
  const notice = document.getElementById("notice");
  let noticeTimer;

  if (resetButton && notice) {
    resetButton.addEventListener("click", function () {
      notice.textContent = "Solicitud de restablecimiento enviada.";
      notice.classList.add("show");
      clearTimeout(noticeTimer);

      noticeTimer = setTimeout(function () {
        notice.classList.remove("show");
      }, 2500);
    });
  }
});
