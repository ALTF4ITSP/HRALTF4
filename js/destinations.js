// Destinos: usa la página genérica de Gestión (js/gestion-tabla.js).
// mapa: true agrega un mapa al formulario para marcar la ubicación (la usan los traslados y las rutas).
crearPaginaGestion({
  modulo: "destinos",
  titulo: "Destinos",
  singular: "destino",
  nuevoId: () => `destino-${Date.now()}`,
  mapa: true,
  campos: [
    { campo: "name", etiqueta: "Nombre", requerido: true, enTabla: true },
    { campo: "address", etiqueta: "Dirección", requerido: true, largo: 200, enTabla: true },
    { campo: "locality", etiqueta: "Localidad", requerido: true, largo: 100, enTabla: true },
    { campo: "status", etiqueta: "Estado", tipo: "select", opciones: ["Activo", "Inactivo"], enTabla: true }
  ]
});
