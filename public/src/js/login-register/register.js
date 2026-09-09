document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');

    const passwordInput = document.getElementById('contraseña');
    const toggleBtn = document.getElementById('togglePasswordBtn');
    const eyeIcon = document.getElementById('eyeIcon');

    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');

    const registerMessage = document.getElementById('registerMessage');


    //mostrar/ocultar contraseña
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


    //barra de seguridad
    if (passwordInput && strengthBar && strengthText) {

        passwordInput.addEventListener('input', () => {

            const val = passwordInput.value;

            let score = 0;

            if (val.length === 0) {

                strengthBar.style.width = '0%';
                strengthText.textContent = '';

                return;
            }

            //al menos 8 caracteres
            if (val.length >= 8) score++;

            //mayscula
            if (/[A-Z]/.test(val)) score++;

            //minuscula
            if (/[a-z]/.test(val)) score++;

            //numero
            if (/[0-9]/.test(val)) score++;

            //simbolo
            if (/[^A-Za-z0-9]/.test(val)) score++;


            const levels = [

                {
                    label: 'Muy débil',
                    color: '#ff4d4d',
                    width: '20%'
                },

                {
                    label: 'Débil',
                    color: '#ff944d',
                    width: '40%'
                },

                {
                    label: 'Media',
                    color: '#ffd633',
                    width: '60%'
                },

                {
                    label: 'Buena',
                    color: '#9acd32',
                    width: '80%'
                },

                {
                    label: 'Fuerte',
                    color: '#2ecc71',
                    width: '100%'
                }

            ];


            const current = levels[score - 1] || levels[0];

            strengthBar.style.width = current.width;
            strengthBar.style.backgroundColor = current.color;

            strengthText.textContent = `Nivel: ${current.label}`;
            strengthText.style.color = current.color;

        });

    }


    //registro
    if (form) {

        form.addEventListener('submit', async (event) => {

            event.preventDefault();

            registerMessage.textContent = '';
            registerMessage.style.color = '';


            //comprobar campos obligatorios
            if (!form.checkValidity()) {

                form.reportValidity();

                return;
            }


            //datos del formulario
            const formData = new FormData(form);


            try {

                registerMessage.textContent = 'Registrando usuario...';


                const response = await fetch(form.action, {

                    method: 'POST',

                    body: formData,

                    headers: {
                        Accept: 'application/json'
                    }

                });


                //intentar leer json
                const data = await response.json();


                if (!response.ok || data.success !== true) {

                    throw new Error(
                        data?.error?.message ||
                        data?.message ||
                        'No se pudo registrar el usuario.'
                    );

                }


                //registro correcto
                registerMessage.textContent =
                    'Usuario registrado correctamente.';

                registerMessage.style.color = '#2ecc71';


                //limpiar formulario
                form.reset();

                strengthBar.style.width = '0%';
                strengthText.textContent = '';


                //ir al inicio de sesión después de 1.5 segundos
                setTimeout(() => {

                    window.location.href = '../../../index.html';

                }, 1500);


            } catch (error) {

                console.error(error);

                registerMessage.textContent =
                    error.message ||
                    'No se pudo conectar con el servidor.';

                registerMessage.style.color = '#ff4d4d';

            }

        });

    }

});