// Carga y guarda las listas de las pantallas de Gestión en la base de datos (php/gestion.php).
// Lo usan patients.js, doctors.js, personnel.js, ambulances.js, destinations.js y routes.js.
const gestionApi = {
  // Devuelve la lista guardada del módulo ("pacientes", "medicos", "personal"...)
  async cargar(modulo) {
    try {
      const response = await fetch(`../php/gestion.php?modulo=${modulo}`, { headers: { Accept: "application/json" } });
      const data = await response.json();
      if (!response.ok || data.success !== true) throw new Error(data?.error?.message);
      return data.data;
    } catch (error) {
      gestionApi.avisar(error.message || "No se pudieron cargar los datos.");
      return [];
    }
  },

  // Guarda la lista completa. Si falla, muestra un aviso y recarga la página
  // para volver a ver lo que realmente quedó guardado.
  async guardar(modulo, lista) {
    try {
      const response = await fetch("../php/gestion.php", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ modulo, lista })
      });
      const data = await response.json();
      if (!response.ok || data.success !== true) throw new Error(data?.error?.message);
    } catch (error) {
      gestionApi.avisar(`${error.message || "No se pudieron guardar los cambios."} Se recargará la página.`);
      setTimeout(() => window.location.reload(), 3500);
    }
  },

  // Cartel rojo abajo de la pantalla
  avisar(mensaje) {
    let aviso = document.getElementById("gestion-aviso");
    if (!aviso) {
      aviso = document.createElement("p");
      aviso.id = "gestion-aviso";
      aviso.setAttribute("role", "alert");
      aviso.style.cssText = "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:1000;" +
        "margin:0;padding:12px 20px;border-radius:12px;background:#5c1d2a;color:#fff;font:inherit;" +
        "box-shadow:0 10px 30px rgba(0,0,0,.35);max-width:calc(100% - 32px)";
      document.body.appendChild(aviso);
    }
    aviso.textContent = mensaje;
  }
};
