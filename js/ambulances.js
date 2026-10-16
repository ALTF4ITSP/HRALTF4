// Ambulancias: usa la página genérica de Gestión (js/gestion-tabla.js)
crearPaginaGestion({
  modulo: "ambulancias",
  titulo: "Ambulancias",
  singular: "ambulancia",
  // Las ambulancias usan números como id: el siguiente al más alto
  nuevoId: lista => Math.max(0, ...lista.map(a => a.id)) + 1,
  campos: [
    { campo: "plate", etiqueta: "Matrícula", requerido: true, largo: 20, enTabla: true },
    { campo: "model", etiqueta: "Modelo", requerido: true, largo: 100, enTabla: true },
    { campo: "capacity", etiqueta: "Capacidad (plazas)", tipo: "number", min: 1, max: 20, requerido: true, enTabla: true },
    {
      campo: "status", etiqueta: "Estado", tipo: "select", enTabla: true,
      opciones: [
        { valor: "OPERATIVA", texto: "Operativa" },
        { valor: "MANTENIMIENTO", texto: "En mantenimiento" },
        { valor: "FUERA_SERVICIO", texto: "Fuera de servicio" }
      ]
    }
  ]
});
