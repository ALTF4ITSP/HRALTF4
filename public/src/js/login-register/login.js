document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('loginContraseña');
    const toggleBtn = document.getElementById('toggleLoginPasswordBtn');
    const eyeIcon = document.getElementById('loginEyeIcon');

    if (toggleBtn && passwordInput && eyeIcon) {
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();

            const isPassword = passwordInput.type === 'password';

            // Cambia el tipo de input entre password y text
            passwordInput.type = isPassword ? 'text' : 'password';

            // Cambia la ruta del SVG local
            if (isPassword) {
                eyeIcon.src = 'assets/Icons/eye-closed.svg';
            } else {
                eyeIcon.src = 'assets/Icons/eye.svg';
            }
        });
    }
});
