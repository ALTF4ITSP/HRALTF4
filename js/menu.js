// Lo que comparten todas las páginas con menú: el botón ☰ del celular, el buscador de secciones
// y el nombre del usuario en el inicio ("¡Bienvenido Ana!").
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // ---------- Botón ☰ (en el celular abre y cierra el menú) ----------
  document.querySelector(".boton-menu")?.addEventListener("click", () => {
    document.body.classList.toggle("menu-abierto");
  });

  // ---------- Buscador de secciones ----------
  // Cada sección tiene palabras con las que se la puede encontrar
  const SECCIONES = [
    { nombre: "Inicio", pagina: "main-menu.html", palabras: "inicio menu principal" },
    { nombre: "Ver documentos", pagina: "documents.html", palabras: "documentos archivos buscar" },
    { nombre: "Cargar documento", pagina: "documents-upload.html", palabras: "subir cargar documento archivo nuevo" },
    { nombre: "Ambulancias y traslados", pagina: "trace.html", palabras: "traslado ambulancia mapa nuevo traslado" },
    { nombre: "Calendario", pagina: "calendar.html", palabras: "calendario turnos agenda consulta" },
    { nombre: "Encuestas", pagina: "surveys.html", palabras: "encuestas respuestas" },
    { nombre: "Nueva encuesta", pagina: "survey-new.html", palabras: "crear nueva encuesta" },
    { nombre: "Gestión de datos", pagina: "management.html", palabras: "gestion datos administrar" },
    { nombre: "Pacientes", pagina: "patients.html", palabras: "pacientes paciente" },
    { nombre: "Médicos", pagina: "doctors.html", palabras: "medicos doctores" },
    { nombre: "Personal", pagina: "personnel.html", palabras: "personal chofer choferes acompañante" },
    { nombre: "Ambulancias", pagina: "ambulances.html", palabras: "ambulancias vehiculos" },
    { nombre: "Destinos", pagina: "destinations.html", palabras: "destinos hospitales lugares" },
    { nombre: "Rutas", pagina: "routes.html", palabras: "rutas recorridos" },
    { nombre: "Configuración", pagina: "settings.html", palabras: "configuracion perfil contraseña idioma foto" }
  ];

  // Sin mayúsculas ni tildes: "Médicos" se encuentra escribiendo "medicos"
  const normalizar = texto => texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  const buscador = document.getElementById("buscadorGeneral");
  const resultados = document.getElementById("resultadosGenerales");

  buscador?.addEventListener("input", () => {
    const texto = normalizar(buscador.value.trim());
    const encontradas = texto
      ? SECCIONES.filter(s => normalizar(`${s.nombre} ${s.palabras}`).includes(texto))
      : [];
    resultados.innerHTML = encontradas.map(s => `<li><a href="${s.pagina}">${s.nombre}</a></li>`).join("");
    resultados.hidden = encontradas.length === 0;
  });

  // Enter va a la primera sección encontrada
  buscador?.addEventListener("keydown", evento => {
    const primera = resultados.querySelector("a");
    if (evento.key === "Enter" && primera) window.location.href = primera.href;
  });

  // Al hacer clic afuera se cierra la lista
  document.addEventListener("click", evento => {
    if (resultados && !evento.target.closest(".buscador-general")) resultados.hidden = true;
  });

  // ---------- Nombre del usuario (en el inicio) ----------
  const bienvenida = document.querySelector("[data-bienvenida]");
  if (bienvenida) {
    fetch("../php/settings_get.php")
      .then(respuesta => respuesta.json())
      .then(datos => {
        const nombre = datos.data?.usuario?.nombre;
        if (nombre) bienvenida.textContent = `¡Bienvenido/a, ${nombre}!`;
      });
  }
});
