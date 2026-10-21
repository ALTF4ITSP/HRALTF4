// Traducción al inglés.
// - El botón EN / ES de arriba cambia el idioma. El navegador lo recuerda (localStorage).
// - Las traducciones están en idiomas/en.json:
//     "textos":   { "texto en español": "texto en inglés", ... }
//     "patrones": textos que cambian, como "¡Bienvenido/a, Ana!" (el (.+) es la parte que cambia)
// - En inglés, se reemplaza cada texto de la página que esté en "textos". También los que aparecen
//   después (por ejemplo las filas de una tabla), gracias al MutationObserver.
(() => {
  "use strict";
  // La carpeta idiomas/ está al lado de js/: se busca desde donde está este archivo
  const archivo = new URL("../idiomas/en.json", document.currentScript.src);

  let idioma = "es";
  try {
    idioma = localStorage.getItem("idioma") || "es";
  } catch (error) {
    // Si el navegador no deja guardar, queda en español
  }

  document.addEventListener("DOMContentLoaded", async () => {
    // ---------- Botón EN / ES ----------
    const boton = document.getElementById("botonIdioma");
    if (boton) {
      boton.textContent = idioma === "en" ? "ES" : "EN";
      boton.addEventListener("click", () => {
        try {
          localStorage.setItem("idioma", idioma === "en" ? "es" : "en");
        } catch (error) { /* sin localStorage no se puede cambiar */ }
        window.location.reload();
      });
    }

    // La lista "Idioma" de Configuración hace lo mismo que el botón
    const lista = document.getElementById("settings-language");
    if (lista) {
      lista.value = idioma;
      lista.addEventListener("change", () => {
        try {
          localStorage.setItem("idioma", lista.value);
        } catch (error) { /* sin localStorage no se puede cambiar */ }
        window.location.reload();
      });
    }

    if (idioma !== "en") return;

    // ---------- Traducir ----------
    const { textos, patrones } = await (await fetch(archivo)).json();

    function traducir(texto) {
      const limpio = texto.trim();
      if (!limpio) return texto;
      if (textos[limpio]) return texto.replace(limpio, textos[limpio]);
      // Patrones: $1, $2... son las partes que cambian; si alguna también está en "textos", se traduce
      for (const [patron, ingles] of patrones) {
        const partes = limpio.match(new RegExp(patron));
        if (partes) return texto.replace(limpio, ingles.replace(/\$(\d)/g, (_, n) => textos[partes[n]] || partes[n]));
      }
      return texto;
    }

    // Traduce los textos y los atributos que se leen (placeholder, aria-label, title) dentro de un elemento
    function traducirTodo(raiz) {
      const recorrido = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
      while (recorrido.nextNode()) {
        const nodo = recorrido.currentNode;
        const nuevo = traducir(nodo.nodeValue);
        if (nuevo !== nodo.nodeValue) nodo.nodeValue = nuevo;
      }
      if (raiz.querySelectorAll) {
        raiz.querySelectorAll("[placeholder], [aria-label], [title]").forEach(elemento => {
          ["placeholder", "aria-label", "title"].forEach(atributo => {
            if (elemento.hasAttribute(atributo)) elemento.setAttribute(atributo, traducir(elemento.getAttribute(atributo)));
          });
        });
      }
    }

    document.documentElement.lang = "en";
    document.title = traducir(document.title);
    traducirTodo(document.body);

    // Lo que los JS agregan después también se traduce
    new MutationObserver(cambios => {
      cambios.forEach(cambio => {
        cambio.addedNodes.forEach(nodo => {
          if (nodo.nodeType === Node.TEXT_NODE) {
            const nuevo = traducir(nodo.nodeValue);
            if (nuevo !== nodo.nodeValue) nodo.nodeValue = nuevo;
          } else if (nodo.nodeType === Node.ELEMENT_NODE) {
            traducirTodo(nodo);
          }
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  });
})();
