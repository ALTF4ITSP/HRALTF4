# Guía: agregar tablas y datos para una página nueva

Esta guía sirve para cuando una página nueva (como Encuestas) necesita guardar datos. Antes conviene leer la [guía de la base de datos](guia-base-de-datos.md), que explica cómo viajan los datos.

---

## Resumen: los 6 pasos

| # | Qué hacés | Dónde |
|---|---|---|
| 0 | Copia de seguridad | Terminal |
| 1 | Diseñar la tabla (en papel) | — |
| 2 | Crear la tabla **sin borrar nada** | phpMyAdmin → pestaña SQL |
| 3 | Agregarla a `database.sql` y al archivo de cambios | `base-de-datos/` |
| 4 | Escribir el PHP | `php/` |
| 5 | Llamarlo desde el JS | `js/` (y la página en `html/`) |
| 6 | Probar desde XAMPP | `http://localhost:880/cARPETA/HRALTF4/...` |

---

## Paso 0 — Copia de seguridad

Siempre, antes de tocar la estructura de la base:

```bash
/opt/lampp/bin/mysqldump -uroot altf4 > ~/backup-altf4-$(date +%F).sql
```

---

## Paso 1 — Diseñar la tabla

Antes de escribir SQL, respondé estas preguntas:

1. **¿Qué es cada fila?** Por ejemplo: "un aviso", "una pregunta", "una respuesta".
2. **¿Qué datos tiene?** Esas son las columnas.
3. **¿Con qué otra tabla se relaciona?** Eso se resuelve con una clave foránea (FK).
4. **¿Qué datos son obligatorios?** Esos llevan `NOT NULL`.

### Tipos de datos más usados

| Para guardar… | Tipo | Ejemplo |
|---|---|---|
| Un id o número entero | `int(11)` | `id_aviso`, `cantidad` |
| Texto corto (hasta 255) | `varchar(N)` | `varchar(200)` para un título |
| Texto largo | `text` | el cuerpo de un aviso |
| Sí / No | `tinyint(1)` | `activo` (1 = sí, 0 = no) |
| Fecha | `date` | `2026-10-15` |
| Fecha y hora | `datetime` | `2026-10-15 14:30:00` |
| Número con decimales | `decimal(8,2)` | `380.50` |
| Un estado fijo | `varchar(30)` | `'ACTIVA'`, `'BORRADOR'` (siempre en MAYÚSCULAS, como en el resto de la base) |

### Reglas que sigue todo el proyecto

- La primera columna es `id_<tabla>` con `int(11) NOT NULL AUTO_INCREMENT` y es la `PRIMARY KEY`.
- Las FK se llaman igual que la columna a la que apuntan (`id_persona`, `id_encuesta`, …).
- Todas las tablas terminan con:
  `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;`
  (así se guardan bien los acentos y la ñ).
- Nombres de tablas y columnas en **minúscula**, **singular** y **sin acentos**: `encuesta`, `fecha_creacion`.

---

## Ejemplo completo: una tabla de avisos

Supongamos que queremos que el Inicio muestre **avisos** que escribe el personal (por ejemplo, "Mañana se corta la luz de 8 a 10").

- Cada fila es un aviso.
- Datos: título, texto, fecha, quién lo escribió y si está visible.
- Se relaciona con `funcionario`, porque lo escribe alguien del personal.

### Paso 2 — Crear la tabla sin borrar nada

En **phpMyAdmin** (<http://localhost:880/phpmyadmin>), entrá a la base `altf4`, abrí la pestaña **SQL** y ejecutá:

```sql
CREATE TABLE `aviso` (
  `id_aviso` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(200) NOT NULL,
  `texto` varchar(1000) NOT NULL,
  `fecha_publicacion` datetime NOT NULL DEFAULT current_timestamp(),
  `visible` tinyint(1) NOT NULL DEFAULT 1,
  `id_funcionario` int(11) NOT NULL,
  PRIMARY KEY (`id_aviso`),
  KEY `idx_aviso_funcionario` (`id_funcionario`),
  CONSTRAINT `fk_aviso_funcionario`
    FOREIGN KEY (`id_funcionario`) REFERENCES `funcionario` (`id_persona`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;
```

Qué significa cada parte:

- `NOT NULL` → la columna es obligatoria.
- `DEFAULT current_timestamp()` → si no le mandás fecha, usa la de ahora.
- `KEY ...` → un índice, para que las búsquedas por esa columna sean rápidas.
- `CONSTRAINT ... FOREIGN KEY` → `id_funcionario` **tiene que existir** en `funcionario`. Si no existe, la base rechaza el `INSERT`.
- `ON DELETE RESTRICT` → no deja borrar un funcionario que tenga avisos.

Para cargar **datos de ejemplo** (valores), en la misma pestaña SQL:

```sql
INSERT INTO `aviso` (`titulo`, `texto`, `id_funcionario`) VALUES
  ('Corte de luz', 'Mañana se corta la luz de 8 a 10 en el ala norte.', 3),
  ('Vacunación', 'La campaña de vacunación empieza el lunes.', 2);
```

No hace falta poner `id_aviso`, `fecha_publicacion` ni `visible`, porque se completan solos. El `id_funcionario` tiene que ser un `id_persona` que exista en `funcionario`.

### Paso 3 — Guardarlo para el equipo

Tus compañeros tienen **su propia base** en su computadora. Para que también tengan la tabla, hay que dejarla escrita en dos lugares:

**a) En `base-de-datos/database.sql`**, para que la tenga quien cree la base desde cero:

1. Agregá `DROP TABLE IF EXISTS \`aviso\`;` **arriba de todo**, en la lista de `DROP`, **antes** de la línea de `funcionario`. Las tablas que apuntan a otras se borran primero.
2. Pegá el `CREATE TABLE` y el `INSERT` **después** del `CREATE TABLE \`funcionario\``. Una tabla solo puede apuntar a otra que ya exista.
3. Si cargaste datos de ejemplo, agregá al final, junto a las otras líneas iguales:
   `ALTER TABLE \`aviso\` AUTO_INCREMENT = 3;` (el próximo id libre).

**b) En un archivo de cambios**, para quien ya tiene la base y **no quiere borrarla**: creá `base-de-datos/cambios/2026-10-15-tabla-aviso.sql` con solo el `CREATE TABLE` y el `INSERT`. Tus compañeros lo ejecutan en su pestaña SQL y no pierden nada.

> Nunca le pidas a nadie que reimporte `database.sql` completo: borra todo lo que tenga cargado.

### Paso 4 — El PHP

Creá un archivo por acción en `php/`. El nombre empieza con el módulo (`avisos-...`), así quedan juntos en la carpeta.

**`php/avisos-list.php`** — devuelve los avisos visibles:

```php
<?php
declare(strict_types=1);
require_once __DIR__ . '/connection.php';
header('Content-Type: application/json; charset=utf-8');

try {
    $consulta = db()->query(
        "SELECT a.id_aviso, a.titulo, a.texto,
                DATE_FORMAT(a.fecha_publicacion, '%d/%m/%Y') AS fecha,
                CONCAT(p.nombre, ' ', p.apellido) AS autor
         FROM aviso a
         INNER JOIN persona p ON p.id_persona = a.id_funcionario
         WHERE a.visible = 1
         ORDER BY a.fecha_publicacion DESC"
    );
    echo json_encode(['success' => true, 'data' => $consulta->fetchAll()], JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    error_log('[avisos_list] ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => ['message' => 'No se pudieron cargar los avisos.']], JSON_UNESCAPED_UNICODE);
}
```

**`php/avisos-create.php`** — guarda un aviso nuevo:

```php
<?php
declare(strict_types=1);
require_once __DIR__ . '/connection.php';
header('Content-Type: application/json; charset=utf-8');

function aviso_error(int $status, string $message): never
{
    http_response_code($status);
    echo json_encode(['success' => false, 'error' => ['message' => $message]], JSON_UNESCAPED_UNICODE);
    exit;
}

// 1. Solo se aceptan envíos por POST
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') aviso_error(405, 'Método no permitido.');

// 2. Hay que haber iniciado sesión (de ahí sale quién escribe el aviso)
session_start();
$idFuncionario = (int) ($_SESSION['id_funcionario'] ?? 0);
if ($idFuncionario < 1) aviso_error(401, 'La sesión no está iniciada.');

// 3. Leer y validar los datos (los "name" del formulario)
$titulo = trim($_POST['titulo'] ?? '');
$texto = trim($_POST['texto'] ?? '');
if ($titulo === '' || mb_strlen($titulo) > 200) aviso_error(422, 'El título es obligatorio (máximo 200 caracteres).');
if ($texto === '' || mb_strlen($texto) > 1000) aviso_error(422, 'El texto es obligatorio (máximo 1000 caracteres).');

// 4. Guardar. Los "?" se reemplazan por los valores de forma segura
try {
    $insertar = db()->prepare('INSERT INTO aviso (titulo, texto, id_funcionario) VALUES (?, ?, ?)');
    $insertar->execute([$titulo, $texto, $idFuncionario]);

    http_response_code(201);
    echo json_encode(['success' => true, 'id_aviso' => (int) db()->lastInsertId()], JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    error_log('[avisos_create] ' . $error->getMessage());
    aviso_error(500, 'No se pudo guardar el aviso.');
}
```

> **Siempre usá `prepare` con `?`.** Nunca pegues un dato del usuario directamente dentro del SQL, como en `"... WHERE titulo = '$titulo'"`, porque eso permite inyección SQL.

### Paso 5 — El JS

Para **mostrar** los avisos (desde una página en `html/`):

```js
fetch("../php/avisos-list.php", { headers: { Accept: "application/json" } })
  .then((response) => response.json())
  .then((data) => {
    if (data.success !== true) throw new Error(data.error.message);
    const lista = document.getElementById("listaAvisos");
    lista.innerHTML = "";
    data.data.forEach((aviso) => {
      const item = document.createElement("li");
      item.textContent = `${aviso.fecha} — ${aviso.titulo}: ${aviso.texto}`;  // textContent evita inyectar HTML
      lista.appendChild(item);
    });
  })
  .catch((error) => console.error(error));
```

Para **guardar** uno nuevo, desde un formulario con `<input name="titulo">` y `<textarea name="texto">`:

```js
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const response = await fetch("../php/avisos-create.php", {
    method: "POST",
    body: new FormData(form),     // manda todos los campos con su "name"
    credentials: "same-origin"    // manda la sesión (para saber quién escribe)
  });
  const data = await response.json();
  mensaje.textContent = data.success ? "Aviso publicado." : data.error.message;
});
```

### Paso 6 — Probar

1. Abrí la página desde **XAMPP** (`localhost:880`), no desde Go Live.
2. Si algo falla, apretá **F12 → Red (Network)**, hacé clic en el pedido al PHP y mirá la **Respuesta**.
3. Revisá en phpMyAdmin que la fila se haya guardado.

---

## Modificar una tabla que ya existe

Para **agregar una columna**, se usa `ALTER TABLE`, que no borra nada. Ejemplo real: así se agregaron las opciones de las preguntas de encuestas:

```sql
ALTER TABLE `pregunta`
  ADD COLUMN `opciones` varchar(1000) DEFAULT NULL AFTER `obligatoria`;
```

- Si la columna nueva es obligatoria (`NOT NULL`), dale un `DEFAULT`. Si no, las filas que ya existen no tienen ningún valor y la base da error.
- Después agregá la columna también en el `CREATE TABLE` de `database.sql` y en un archivo de `base-de-datos/cambios/`.

Otros cambios útiles:

```sql
-- Cambiar el tamaño o el tipo de una columna
ALTER TABLE `aviso` MODIFY `titulo` varchar(300) NOT NULL;

-- Volver opcional una columna obligatoria
ALTER TABLE `funcionario` MODIFY `legajo` varchar(20) DEFAULT NULL;

-- Actualizar datos que ya existen
UPDATE `aviso` SET `visible` = 0 WHERE `id_aviso` = 1;
```

---

## Las pantallas de Gestión: un solo PHP para todas

Pacientes, Médicos, Personal, Ambulancias, Destinos y Rutas comparten **un solo PHP**: `php/gestion.php`. Cada pantalla carga y guarda su lista completa con `js/gestion-api.js`:

```js
gestionApi.cargar("pacientes").then(lista => { patients = lista; renderList(); });  // al abrir
gestionApi.guardar("pacientes", patients);                                          // al guardar o borrar
```

Al guardar, el PHP actualiza las filas que ya existen, agrega las nuevas y borra las que ya no están, todo en una transacción.

| Pantalla | Módulo | Tabla |
|---|---|---|
| Pacientes | `pacientes` | `gestion_paciente` |
| Médicos | `medicos` | `gestion_medico` |
| Personal | `personal` | `gestion_personal` |
| Ambulancias | `ambulancias` | `ambulancia` |
| Destinos | `destinos` | `gestion_destino` |
| Rutas | `rutas` | `gestion_ruta` |

**Para agregar un dato nuevo a una de esas pantallas** (por ejemplo, el email del paciente):

1. Agregá la columna: `ALTER TABLE gestion_paciente ADD COLUMN email varchar(150) DEFAULT NULL;`
2. En `php/gestion.php`, dentro de `MODULOS['pacientes']['campos']`, agregá la línea `'email' => 'email',` (a la izquierda el nombre del dato en el JS, a la derecha la columna).
3. Agregá el campo al formulario en el HTML y al objeto que arma el JS al guardar.

No hace falta tocar nada más: el PHP lee la lista de campos para saber qué guardar.

> Como se guarda la lista completa, si dos personas editan **la misma pantalla al mismo tiempo**, queda lo que guardó la última.

**Traslados y Calendario tienen su propio PHP** (`php/traslados.php` y `php/turnos.php`), porque cada traslado o turno se guarda por separado y combina datos de varias tablas:

- `gestion_traslado` usa la ambulancia (`ambulancia`), el chofer y el acompañante (`gestion_personal`), el origen y el destino (`gestion_destino`) y el paciente (`gestion_paciente`).
- `turno` usa el paciente (`gestion_paciente`) y el médico (`gestion_medico`).

Por eso no se puede borrar en Gestión algo que un traslado o un turno está usando: la base lo impide y aparece un aviso.

## Cómo se armaron las encuestas (ejemplo real del proyecto)

Las encuestas usan 4 tablas encadenadas:

```
encuesta  1 ──── N  pregunta          (una encuesta tiene muchas preguntas)
    │                   │
    1                   1
    │                   │
    N                   N
envio_encuesta 1 ── N respuesta       (cada vez que alguien responde = 1 envío,
                                       con 1 respuesta por pregunta)
```

| Tabla | Una fila es… | Columnas clave |
|---|---|---|
| `encuesta` | una encuesta | `titulo`, `estado` (`ACTIVA`/`BORRADOR`/`FINALIZADA`), `id_servicio` (la categoría), `id_funcionario_crea` |
| `pregunta` | una pregunta | `id_encuesta`, `enunciado`, `tipo` (`OPCION`/`ESCALA`/`SI_NO`/`TEXTO`), `orden`, `opciones` |
| `envio_encuesta` | una vez que alguien completó la encuesta | `id_encuesta`, `fecha_hora`, `completada` |
| `respuesta` | la respuesta a una pregunta | `id_envio`, `id_pregunta`, `respuesta_texto` |

El PHP de cada acción está en `php/`:

| Acción | PHP | Qué hace en la base |
|---|---|---|
| Listar | `surveys-list.php` | `SELECT` de `encuesta` y cuenta preguntas y respuestas con subconsultas |
| Ver una | `surveys-get.php` | `SELECT` de la encuesta y sus preguntas, ordenadas por `orden` |
| Crear | `surveys-create.php` | En una transacción: 1 `INSERT` en `encuesta` + 1 `INSERT` por pregunta |
| Responder | `surveys-answer.php` | En una transacción: 1 `INSERT` en `envio_encuesta` + 1 `INSERT` en `respuesta` por pregunta |
| Borrar | `surveys-delete.php` | Borra en orden: respuestas → envíos → preguntas → encuesta (por las FK) |

**¿Por qué se borra en ese orden?** Porque `respuesta` apunta a `envio_encuesta`, que apunta a `encuesta`. La base no deja borrar una fila mientras otra apunte a ella, así que se borra desde "las hojas" hacia "la raíz".

---

## Errores comunes

| Error | Causa | Solución |
|---|---|---|
| `JSON.parse: unexpected character` | La página está abierta con Go Live (`:5500`) | Abrila desde `localhost:880` |
| `404` al llamar al PHP | La ruta del `fetch` está mal escrita | Desde una página de `html/` siempre es `../php/<archivo>.php` |
| `Cannot add or update a child row: a foreign key constraint fails` | El id que mandás no existe en la otra tabla | Revisá que exista, por ejemplo el `id_funcionario` |
| `Cannot delete or update a parent row` | Hay filas en otra tabla que apuntan a la que querés borrar | Borrá primero las de la otra tabla |
| `Unknown column 'x' in 'field list'` | Tu base no tiene esa columna (está desactualizada) | Ejecutá el archivo de `base-de-datos/cambios/` que la agrega |
| `Field 'x' doesn't have a default value` | Una columna `NOT NULL` sin `DEFAULT` no se completó en el `INSERT` | Agregala al `INSERT` o dale un `DEFAULT` |
| Aparecen `Ã³` en vez de `ó` | La tabla no es `utf8mb4` | Creala con `CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci` |

---

## Checklist final

- [ ] Hice la copia de seguridad.
- [ ] Creé la tabla con `CREATE TABLE` (sin `DROP`) en mi base.
- [ ] La agregué a `database.sql`: `DROP` arriba, `CREATE` en orden y `AUTO_INCREMENT` al final.
- [ ] Creé el archivo en `base-de-datos/cambios/` para mis compañeros.
- [ ] PHP en `php/<modulo>-<accion>.php` con `prepare` y `?`.
- [ ] El JS usa `fetch` y muestra `data.error.message` si algo falla.
- [ ] Lo probé desde `localhost:880` y vi la fila en phpMyAdmin.
