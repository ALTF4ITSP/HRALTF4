// Personal (choferes y acompañantes): usa la página genérica de Gestión (js/gestion-tabla.js)
crearPaginaGestion({
  modulo: "personal",
  titulo: "Personal",
  singular: "integrante",
  nuevoId: () => `persona-${Date.now()}`,
  campos: [
    { campo: "name", etiqueta: "Nombre completo", requerido: true, enTabla: true },
    { campo: "role", etiqueta: "Rol", tipo: "select", opciones: ["Chofer", "Acompañante"], enTabla: true },
    { campo: "document", etiqueta: "Cédula", largo: 20, enTabla: true },
    { campo: "phone", etiqueta: "Teléfono", largo: 30, enTabla: true },
    { campo: "status", etiqueta: "Estado", tipo: "select", opciones: ["Activo", "Inactivo"], enTabla: true }
  ]
});
