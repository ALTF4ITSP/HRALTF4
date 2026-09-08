document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('contraseña');
    const toggleBtn = document.getElementById('togglePasswordBtn');
    const eyeIcon = document.getElementById('eyeIcon');
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');

    // 1. Lógica para alternar visibilidad con tus SVG
    if (toggleBtn && passwordInput && eyeIcon) {
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const isPassword = passwordInput.type === 'password';

            passwordInput.type = isPassword ? 'text' : 'password';

            if (isPassword) {
                eyeIcon.src = '../../../assets/Icons/eye-closed.svg';
            } else {
                eyeIcon.src = '../../../assets/Icons/eye.svg';
            }
        });
    }

    // 2. Lógica para evaluar la fuerza de la contraseña
    if (passwordInput && strengthBar && strengthText) {
        passwordInput.addEventListener('input', () => {
            const val = passwordInput.value;
            let score = 0;

            if (val.length === 0) {
                strengthBar.style.width = '0%';
                strengthText.textContent = '';
                return;
            }

            // Criterios de evaluación
            if (val.length >= 8) score++;            // Al menos 8 caracteres
            if (/[A-Z]/.test(val)) score++;          // Contiene mayúscula
            if (/[0-9]/.test(val)) score++;          // Contiene número
            if (/[^A-Za-z0-9]/.test(val)) score++;   // Contiene símbolo (!@#$)

            const levels = [
                { label: 'Muy débil', color: '#ff4d4d', width: '25%' },
                { label: 'Débil',     color: '#ff944d', width: '50%' },
                { label: 'Media',     color: '#ffd633', width: '75%' },
                { label: 'Fuerte',    color: '#2ecc71', width: '100%' }
            ];

            const current = levels[score - 1] || levels[0];

            strengthBar.style.width = current.width;
            strengthBar.style.backgroundColor = current.color;
            strengthText.textContent = `Nivel: ${current.label}`;
            strengthText.style.color = current.color;
        });
    }
});
