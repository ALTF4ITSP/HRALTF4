document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const form = document.getElementById("documentForm");
  if (!form) return;

  const fileInput = document.getElementById("archivo");
  const uploadArea = document.getElementById("uploadArea");
  const fileSummary = document.getElementById("fileSummary");
  const currentFile = document.getElementById("currentFile");
  const fileName = document.getElementById("selectedFileName");
  const fileMeta = document.getElementById("selectedFileMeta");
  const clearFileButton = document.getElementById("clearFile");
  const formMessage = document.getElementById("formMessage");
  const submitButton = form.querySelector("button[type='submit']");
  const allowedExtensions = new Set(["pdf", "docx", "jpg", "jpeg", "png"]);
  const maxFileBytes = 10 * 1024 * 1024;
  const documentIdField = form.elements.namedItem("id_documento");

  if (documentIdField) {
    const requestedId = new URLSearchParams(window.location.search).get("id");
    if (/^[1-9]\d*$/.test(requestedId || "")) documentIdField.value = requestedId;
  }

  function showMessage(message, isError = false) {
    formMessage.textContent = message;
    formMessage.classList.toggle("error", isError);
  }

  function selectedExtension(file) {
    return file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "";
  }

  function validateFile(file) {
    if (!allowedExtensions.has(selectedExtension(file))) {
      return "El formato debe ser PDF, DOCX, JPG o PNG.";
    }

    if (file.size > maxFileBytes) {
      return "El archivo supera el límite de 10 MB.";
    }

    return "";
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function clearSelectedFile() {
    fileInput.value = "";
    fileSummary.hidden = true;
    if (currentFile) currentFile.hidden = false;
  }

  function renderSelectedFile() {
    const file = fileInput.files[0];

    if (!file) {
      clearSelectedFile();
      return true;
    }

    const error = validateFile(file);
    if (error) {
      clearSelectedFile();
      showMessage(error, true);
      return false;
    }

    fileName.textContent = file.name;
    fileMeta.textContent = `${selectedExtension(file).toUpperCase()} · ${formatFileSize(file.size)}`;
    fileSummary.hidden = false;
    if (currentFile) currentFile.hidden = true;
    showMessage("");
    return true;
  }

  function setSubmitting(isSubmitting) {
    form.setAttribute("aria-busy", String(isSubmitting));
    submitButton.disabled = isSubmitting;
  }

  fileInput.addEventListener("change", renderSelectedFile);
  clearFileButton.addEventListener("click", clearSelectedFile);

  ["dragenter", "dragover"].forEach((eventName) => {
    uploadArea.addEventListener(eventName, (event) => {
      event.preventDefault();
      uploadArea.classList.add("is-dragging");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    uploadArea.addEventListener(eventName, (event) => {
      event.preventDefault();
      uploadArea.classList.remove("is-dragging");
    });
  });

  uploadArea.addEventListener("drop", (event) => {
    const droppedFiles = event.dataTransfer?.files;
    if (!droppedFiles?.length) return;

    if (droppedFiles.length > 1) {
      showMessage("Seleccioná un solo archivo.", true);
      return;
    }

    const transfer = new DataTransfer();
    transfer.items.add(droppedFiles[0]);
    fileInput.files = transfer.files;
    renderSelectedFile();
  });

  uploadArea.addEventListener("drop", (event) => {
    const files = event.dataTransfer?.files;
    if (!files?.length) return;

    if (files.length > 1) {
      showMessage("Seleccioná un solo archivo.", true);
      return;
    }

    fileInput.files = files;
    renderSelectedFile();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      showMessage("Completá los campos obligatorios.", true);
      form.reportValidity();
      return;
    }

    if (fileInput.files[0] && !renderSelectedFile()) return;

    setSubmitting(true);
    showMessage("Guardando documento...");

    try {
      await window.DocumentApi.submit(form);
      const successMessage = form.dataset.mode === "update"
        ? "Cambios guardados correctamente."
        : "Documento cargado correctamente.";

      showMessage(successMessage);
      window.setTimeout(() => {
        window.location.href = "documents.html";
      }, 700);
    } catch (error) {
      showMessage(error.message || "No se pudo conectar con el servidor.", true);
      setSubmitting(false);
    }
  });
});
