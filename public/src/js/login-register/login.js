document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('loginContraseña');
    const toggleBtn = document.getElementById('toggleLoginPasswordBtn');
    const eyeIcon = document.getElementById('loginEyeIcon');

    if (toggleBtn && passwordInput && eyeIcon) {
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();

            const isPassword = passwordInput.type === 'password';

            //dambia el tipo de input entre password y text
            passwordInput.type = isPassword ? 'text' : 'password';

            //cambia la ruta del svg local
            if (isPassword) {
                eyeIcon.src = 'assets/Icons/eye-closed.svg';
            } else {
                eyeIcon.src = 'assets/Icons/eye.svg';
            }
        });
    }

    const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');

if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        loginMessage.textContent = '';

        const formData = new FormData(loginForm);

        try {
            loginMessage.textContent = 'Iniciando sesión...';

            const response = await fetch(loginForm.action, {
                method: 'POST',
                body: formData,
                headers: { Accept: 'application/json' },
                credentials: 'same-origin'
            });

            const data = await response.json();

            if (!response.ok || data.success !== true) {
                throw new Error(
                    data?.error?.message || data?.message || 'No se pudo iniciar sesión.'
                );
            }

            loginMessage.style.color = '#2ecc71';
            loginMessage.textContent = 'Inicio de sesión correcto.';

            window.location.href = 'src/views/main-menu.html';

        } catch (error) {
            loginMessage.style.color = '#ff4d4d';
            loginMessage.textContent = error.message;
        }
    });
}
});
