// Médicos: usa la página genérica de Gestión (js/gestion-tabla.js)
crearPaginaGestion({
  modulo: "medicos",
  titulo: "Médicos",
  singular: "médico",
  nuevoId: () => `d-${Date.now()}`,
  campos: [
    { campo: "name", etiqueta: "Nombre", requerido: true, enTabla: true },
    { campo: "specialty", etiqueta: "Especialidad", requerido: true, largo: 100, enTabla: true },
    { campo: "phone", etiqueta: "Teléfono", largo: 30, enTabla: true },
    { campo: "status", etiqueta: "Estado", tipo: "select", opciones: ["Activo", "Inactivo"], enTabla: true }
  ]
});
