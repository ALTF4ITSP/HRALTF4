document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".settings-tab");
    const panels = document.querySelectorAll(".settings-panel");

    const nameInput = document.getElementById("settings-name");
    const emailInput = document.getElementById("settings-email");
    const centerInput = document.getElementById("settings-center");
    const languageSelect = document.getElementById("settings-language");

    const photoVisibilityToggle = document.querySelector(
        '.toggle[aria-label="Visibilidad pública de la foto"]'
    );

    const performanceToggle = document.querySelector(
        '.toggle[aria-label="Análisis de rendimiento"]'
    );

    const securityToggle = document.querySelector(
        '.toggle[aria-label="Notificaciones de seguridad"]'
    );

    const automaticLogoutToggle = document.querySelector(
        '.toggle[aria-label="Cerrar sesión automáticamente"]'
    );

    const specialtyList = document.querySelector(".specialty-list");
    const specialtyAddButton = document.querySelector(".specialty-add");
    const uploadButton = document.querySelector(".upload-box");
    const userName = document.querySelector(".user-name");
    const userAvatar = document.querySelector(".user-avatar img");

    /*
     * settings.html está dentro de public/html y las APIs están
     * dentro de public/api.
     */
    const API = "../api";

    /*
     * ------------------------------------------------------------
     * FUNCIONES GENERALES
     * ------------------------------------------------------------
     */

    async function request(url, options = {}) {
        const response = await fetch(url, {
            credentials: "same-origin",
            ...options
        });

        let result;

        try {
            result = await response.json();
        } catch (error) {
            throw new Error("El servidor devolvió una respuesta inválida.");
        }

        if (!response.ok || !result.success) {
            const message =
                result?.error?.message ||
                "No se pudo completar la operación.";

            throw new Error(message);
        }

        return result.data;
    }

    function setToggle(toggle, value) {
        if (!toggle) {
            return;
        }

        const isOn = Boolean(value);

        toggle.classList.toggle("is-on", isOn);
        toggle.setAttribute("aria-checked", String(isOn));
    }

    function getToggleValue(toggle) {
        return Boolean(toggle && toggle.classList.contains("is-on"));
    }

    function showError(error) {
        console.error(error);

        const message =
            error instanceof Error
                ? error.message
                : "Ocurrió un error inesperado.";

        alert(message);
    }

    /*
     * ------------------------------------------------------------
     * PESTAÑAS
     * ------------------------------------------------------------
     */

    function openTab(selectedTab) {
        const panelId = selectedTab.dataset.tab;

        tabs.forEach((tab) => {
            const isSelected = tab === selectedTab;

            tab.classList.toggle("active", isSelected);
            tab.setAttribute("aria-selected", String(isSelected));
            tab.tabIndex = isSelected ? 0 : -1;
        });

        panels.forEach((panel) => {
            panel.hidden = panel.id !== panelId;
        });
    }

    tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => {
            openTab(tab);
        });

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

    /*
     * ------------------------------------------------------------
     * CARGAR CONFIGURACIÓN DESDE MYSQL
     * ------------------------------------------------------------
     */

    async function loadSettings() {
        try {
            const data = await request(`${API}/settings_get.php`);

            const usuario = data.usuario || {};
            const configuracion = data.configuracion || {};

            if (nameInput) {
                nameInput.value = usuario.nombre || "";
            }

            if (emailInput) {
                emailInput.value = usuario.email || "";
            }

            if (centerInput) {
                centerInput.value = configuracion.centro || "";
            }

            if (userName) {
                userName.textContent = usuario.nombre_completo || "Usuario";
            }

            setToggle(photoVisibilityToggle, configuracion.foto_publica);
            setToggle(performanceToggle, configuracion.analisis_rendimiento);
            setToggle(securityToggle, configuracion.notificaciones_seguridad);
            setToggle(
                automaticLogoutToggle,
                configuracion.cierre_sesion_automatico
            );

            if (languageSelect && configuracion.idioma) {
                languageSelect.value = configuracion.idioma;
            }

            loadSpecialties(data.especializaciones || []);

            if (configuracion.foto_perfil && userAvatar) {
                userAvatar.src =
                    `${API}/settings_photo.php?time=${Date.now()}`;
            }
        } catch (error) {
            showError(error);
        }
    }

    /*
     * ------------------------------------------------------------
     * INFORMACIÓN GENERAL
     * ------------------------------------------------------------
     */

    async function updateProfile() {
        const datos = {
            nombre: nameInput ? nameInput.value : "",
            email: emailInput ? emailInput.value : "",
            centro: centerInput ? centerInput.value : "",
            foto_publica: getToggleValue(photoVisibilityToggle)
        };

        const data = await request(`${API}/settings_profile_update.php`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(datos)
        });

        if (userName) {
            const nombre = data.nombre || "";
            const apellido = data.apellido || "";

            userName.textContent =
                `${nombre} ${apellido}`.trim() || "Usuario";
        }

        return data;
    }

    async function saveProfile() {
        try {
            await updateProfile();
        } catch (error) {
            showError(error);
            await loadSettings();
        }
    }

    /*
     * Los campos se guardan cuando el usuario termina de modificarlos.
     */
    [nameInput, emailInput, centerInput].forEach((input) => {
        input?.addEventListener("change", saveProfile);
    });

    /*
     * ------------------------------------------------------------
     * FOTO DE PERFIL
     * ------------------------------------------------------------
     */

    let photoInput = null;

    function createPhotoInput() {
        if (photoInput) {
            return photoInput;
        }

        photoInput = document.createElement("input");
        photoInput.type = "file";
        photoInput.accept = "image/jpeg,image/png,image/webp";
        photoInput.style.display = "none";

        document.body.appendChild(photoInput);

        photoInput.addEventListener("change", uploadPhoto);

        return photoInput;
    }

    function openPhotoSelector() {
        createPhotoInput();
        photoInput.value = "";
        photoInput.click();
    }

    async function uploadPhoto() {
        if (!photoInput.files || !photoInput.files[0]) {
            return;
        }

        const file = photoInput.files[0];

        if (file.size > 5 * 1024 * 1024) {
            alert("La imagen debe pesar como máximo 5 MB.");
            photoInput.value = "";
            return;
        }

        const formData = new FormData();
        formData.append("foto", file);

        try {
            await request(`${API}/settings_photo.php`, {
                method: "POST",
                body: formData
            });

            if (userAvatar) {
                userAvatar.src =
                    `${API}/settings_photo.php?time=${Date.now()}`;
            }

            alert("La foto de perfil se actualizó correctamente.");
        } catch (error) {
            showError(error);
        }
    }

    uploadButton?.addEventListener("click", openPhotoSelector);

    /*
     * ------------------------------------------------------------
     * VISIBILIDAD DE FOTO
     * ------------------------------------------------------------
     */

    photoVisibilityToggle?.addEventListener("click", async () => {
        const previousValue = getToggleValue(photoVisibilityToggle);

        setToggle(photoVisibilityToggle, !previousValue);

        try {
            await updateProfile();
        } catch (error) {
            setToggle(photoVisibilityToggle, previousValue);
            showError(error);
        }
    });

    /*
     * ------------------------------------------------------------
     * PRIVACIDAD
     * ------------------------------------------------------------
     */

    async function updatePrivacy() {
        const datos = {
            analisis_rendimiento: getToggleValue(performanceToggle),
            notificaciones_seguridad: getToggleValue(securityToggle),
            cierre_sesion_automatico: getToggleValue(automaticLogoutToggle)
        };

        /*
         * El idioma sí se guarda.
         *
         * El tema NO se envía porque el modo oscuro/claro todavía
         * no está implementado.
         */
        if (languageSelect) {
            datos.idioma = languageSelect.value;
        }

        return request(`${API}/settings_privacy_update.php`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(datos)
        });
    }

    [
        performanceToggle,
        securityToggle,
        automaticLogoutToggle
    ].forEach((toggle) => {
        toggle?.addEventListener("click", async () => {
            const previousValue = getToggleValue(toggle);

            /*
             * Cambiamos el estado visual antes de guardar.
             */
            setToggle(toggle, !previousValue);

            try {
                await updatePrivacy();
            } catch (error) {
                setToggle(toggle, previousValue);
                showError(error);
            }
        });
    });

    languageSelect?.addEventListener("change", async () => {
        try {
            await updatePrivacy();
            languageSelect.blur();
        } catch (error) {
            showError(error);
            await loadSettings();
        }
    });

    /*
     * ------------------------------------------------------------
     * ESPECIALIZACIONES
     * ------------------------------------------------------------
     */

    function loadSpecialties(specialties) {
        if (!specialtyList) {
            return;
        }

        /*
         * Eliminamos las especializaciones de ejemplo que vienen
         * escritas en el HTML y las reemplazamos por las de MySQL.
         */
        specialtyList
            .querySelectorAll(".specialty-chip")
            .forEach((chip) => chip.remove());

        specialties.forEach((specialty) => {
            addSpecialtyToScreen(specialty);
        });
    }

    function addSpecialtyToScreen(specialty) {
        if (!specialtyList) {
            return;
        }

        const button = document.createElement("button");

        button.type = "button";
        button.className = "specialty-chip";
        button.textContent = specialty.nombre;
        button.dataset.id = specialty.id_especializacion;

        /*
         * Las especializaciones existentes se pueden quitar haciendo
         * clic sobre ellas. Se pide confirmación para evitar borrados
         * accidentales.
         */
        button.addEventListener("click", async () => {
            const confirmar = confirm(
                `¿Querés eliminar "${specialty.nombre}" de tus especializaciones?`
            );

            if (!confirmar) {
                return;
            }

            try {
                await request(`${API}/settings_specialty.php`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        accion: "delete",
                        id_especializacion: specialty.id_especializacion
                    })
                });

                button.remove();
            } catch (error) {
                showError(error);
            }
        });

        specialtyList.insertBefore(button, specialtyAddButton);
    }

    specialtyAddButton?.addEventListener("click", async () => {
        const nombre = prompt("Ingresá una especialización:");

        if (nombre === null) {
            return;
        }

        const nombreLimpio = nombre.trim();

        if (nombreLimpio === "") {
            alert("La especialización no puede estar vacía.");
            return;
        }

        try {
            const data = await request(`${API}/settings_specialty.php`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    accion: "add",
                    nombre: nombreLimpio
                })
            });

            addSpecialtyToScreen(data);
        } catch (error) {
            showError(error);
        }
    });

    /*
     * ------------------------------------------------------------
     * TEMA
     * ------------------------------------------------------------
     *
     * No se implementa todavía.
     * Los botones del tema quedan fuera de la lógica de este archivo
     * hasta que el modo oscuro/claro esté preparado.
     */

    /*
     * ------------------------------------------------------------
     * INICIO
     * ------------------------------------------------------------
     */

    loadSettings();
});
