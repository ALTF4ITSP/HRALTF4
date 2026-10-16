// Pacientes: usa la página genérica de Gestión (js/gestion-tabla.js)
crearPaginaGestion({
  modulo: "pacientes",
  titulo: "Pacientes",
  singular: "paciente",
  nuevoId: () => `p-${Date.now()}`,
  campos: [
    { campo: "name", etiqueta: "Nombre completo", requerido: true, enTabla: true },
    { campo: "dni", etiqueta: "Cédula", requerido: true, largo: 20, enTabla: true },
    { campo: "age", etiqueta: "Edad", tipo: "number", min: 0, max: 120, enTabla: true },
    { campo: "phone", etiqueta: "Teléfono", largo: 30, enTabla: true }
  ]
});
