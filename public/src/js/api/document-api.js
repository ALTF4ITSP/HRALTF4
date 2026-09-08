(function exposeDocumentApi(global) {
  "use strict";

  class DocumentApiError extends Error {
    constructor(message, status, payload) {
      super(message);
      this.name = "DocumentApiError";
      this.status = status;
      this.payload = payload;
    }
  }

  async function submit(form) {
    const response = await fetch(form.action, {
      method: form.method || "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" },
      credentials: "same-origin"
    });

    let payload;

    try {
      payload = await response.json();
    } catch (error) {
      throw new DocumentApiError("El servidor devolvió una respuesta inválida.", response.status, null);
    }

    if (!response.ok || payload.success !== true) {
      const message = payload?.error?.message || "No se pudo guardar el documento.";
      throw new DocumentApiError(message, response.status, payload);
    }

    return payload.data;
  }

  global.DocumentApi = Object.freeze({ submit });
})(window);
