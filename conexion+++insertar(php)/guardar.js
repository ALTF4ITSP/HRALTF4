const nombre = document.getElementById('nombre');
const direccion = document.getElementById('direccion');
const boton = document.getElementById('boton');
const texto = document.getElementById('mensaje');


boton.addEventListener('click', async (e) => {
    e.preventDefault();

    const persona = new FormData();
    persona.append('nombre', nombre.value);
    persona.append('direccion', direccion.value);

    const respuesta = await fetch ('guardar.php', {
        method: 'POST',
        body: persona
    })

    const mensaje = respuesta.text();

    if (mensaje.trim() === "ok"){
        texto.textContent = "Persona Guardada";
        texto.style.color = "green";
    }else{
        texto.textContent = "No se guardo";
        texto.style.color = "red";
    }

    
})