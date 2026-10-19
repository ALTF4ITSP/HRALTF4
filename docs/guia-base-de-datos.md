# Guía: cómo se guardan los datos en la base

Esta guía explica qué pasa desde que alguien completa un formulario hasta que los datos quedan guardados en la base `altf4`. El ejemplo principal es el **registro de usuarios**.

---

## 1. Las piezas del sistema

Cada vez que una página guarda o lee datos, la información pasa por 4 piezas, siempre en el mismo orden:

```
 Navegador                    Servidor (XAMPP)                        Base de datos
┌──────────────┐   fetch   ┌──────────────────────┐  require  ┌────────────────┐   SQL   ┌──────────┐
│ HTML + JS    │ ────────► │ php/                 │ ───────► │ connection.php │ ──────► │ altf4    │
│ (formulario) │ ◄──────── │ (la lógica)          │          │ (la conexión)  │ ◄────── │ (MariaDB)│
└──────────────┘   JSON    └──────────────────────┘           └────────────────┘         └──────────┘
```

Las carpetas del proyecto están ordenadas por tipo de archivo:

| Carpeta | Qué tiene |
|---|---|
| `index.html` | La pantalla de inicio de sesión |
| `html/` | Todas las páginas |
| `css/` | Todos los estilos |
| `js/` | Todos los scripts |
| `php/` | Todos los PHP, incluido `connection.php` |
| `imagenes/` | Íconos, logos y fondos |
| `archivos/` | Lo que sube la gente: `documentos/` y `perfiles/` (fotos) |
| `base-de-datos/` | `database.sql` y `language.json` |
| `docs/` | Estas guías |

Como todas las páginas están en `html/`, siempre se usan las mismas rutas: `../css/`, `../js/`, `../php/` y `../imagenes/`.

| Pieza | Dónde está | Qué hace |
|---|---|---|
| **HTML** | `html/` | El formulario. Cada `<input>` tiene un `name` (ej. `name="nombre"`). |
| **JS** | `js/` | Toma los datos del formulario y los manda con `fetch` al PHP. Después muestra el mensaje de éxito o error. |
| **PHP** | `php/` | Valida los datos y ejecuta las consultas SQL. |
| **Conexión** | `php/connection.php` | Abre la conexión a la base. Todos los PHP la usan. |

### Importante: siempre abrir desde XAMPP

El PHP solo se ejecuta si la página se abre desde **XAMPP**:

```
http://localhost:880/cARPETA/HRALTF4/...
```

Si la abrís con **Go Live** de VS Code (`127.0.0.1:5500`), el PHP **no se ejecuta**. El navegador recibe el texto del archivo en vez de los datos y aparece un error como `JSON.parse: unexpected character`. Live Server solo sirve para ver el diseño.

---

## 2. La conexión: `connection.php`

Todos los PHP empiezan con:

```php
require_once __DIR__ . '/connection.php';
```

Ese archivo tiene dos funciones que hacen lo mismo de dos formas distintas:

| Función | Tipo | La usan |
|---|---|---|
| `db()` | PDO | documentos, encuestas, reportes |
| `db_mysqli()` | mysqli | registro y login |

Los datos de conexión vienen por defecto de XAMPP: servidor `localhost`, usuario `root`, sin contraseña y base `altf4`. En el servidor de la institución se pueden cambiar con variables de entorno (`DB_HOST`, `DB_USER`, etc.) sin tocar el código.

---

## 3. Cómo están organizadas las personas

La base no guarda a todos en una sola tabla. Separa **quién es la persona** de **qué rol tiene**:

```
                    ┌───────────────────────────┐
                    │ persona                   │  ← datos de CUALQUIER persona
                    │ id_persona (PK)           │
                    │ cedula (única)            │
                    │ nombre, apellido          │
                    │ fecha_nacimiento, email   │
                    └─────────────┬─────────────┘
                                  ▼
                    ┌───────────────────────────┐
                    │ funcionario               │
                    │ id_persona (PK y FK)      │
                    │ cargo, sector, activo     │
                    └─────────────┬─────────────┘
                                  ▼
                    ┌───────────────────────────┐
                    │ usuario                   │  ← la CUENTA para iniciar sesión
                    │ id_usuario (PK)           │
                    │ id_funcionario (FK, única)│
                    │ nombre_usuario (único)    │
                    │ password_hash, estado     │
                    └───────────────────────────┘
```

- **`persona`**: nombre, cédula, email, etc. Una persona aparece una sola vez.
- Los **pacientes** no están acá: se cargan en Gestión y se guardan en `gestion_paciente`.
- **`funcionario`**: la persona trabaja en el hospital. No tiene id propio: usa el mismo `id_persona`.
- **`usuario`**: la cuenta para entrar al sistema. Solo los funcionarios tienen cuenta, y cada funcionario puede tener **una** sola.

> **PK** (clave primaria) = el número que identifica cada fila.
> **FK** (clave foránea) = una columna que apunta a la PK de otra tabla. Por ejemplo, `usuario.id_funcionario` apunta a `funcionario.id_persona`.

---

## 4. El registro paso a paso

Archivos involucrados:

| Paso | Archivo |
|---|---|
| Formulario | `html/register.html` |
| JS | `js/register.js` |
| PHP | `php/register.php` |

### Paso 1 — El formulario

El `name` de cada campo es la "etiqueta" con la que llega el dato al PHP:

| Campo en pantalla | `name` en el HTML | Llega al PHP como |
|---|---|---|
| Nombre | `nombre` | `$_POST['nombre']` |
| Apellido | `apellido` | `$_POST['apellido']` |
| Fecha de nacimiento | `fecha_nacimiento` | `$_POST['fecha_nacimiento']` (formato `2008-10-17`) |
| Usuario | `usuario` | `$_POST['usuario']` |
| Contraseña | `contrasena` | `$_POST['contrasena']` |
| Email | `email` | `$_POST['email']` |
| CI | `CI` | `$_POST['CI']` |

### Paso 2 — El JS lo envía

`register.js` arma un `FormData` con todos los campos y lo manda al `action` del formulario:

```js
const formData = new FormData(form);
const response = await fetch(form.action, { method: 'POST', body: formData });
const data = await response.json();   // { success: true } o { success: false, error: {...} }
```

### Paso 3 — El PHP valida

Antes de tocar la base, `register.php` controla que:

1. Todos los campos estén completos.
2. La fecha sea válida y no sea futura.
3. La cédula tenga 7 u 8 números, sin puntos ni guion.
4. El usuario tenga entre 6 y 50 caracteres (letras, números, `.`, `-` o `_`).
5. El email sea válido.
6. La contraseña tenga 8 caracteres o más, con mayúscula, minúscula, número y símbolo.
7. El nombre de usuario no exista.
8. El email no lo use otra persona.
9. Si la cédula ya existe: que no tenga cuenta y que el email coincida.

Si algo falla, responde con un error y **no guarda nada**.

### Paso 4 — Se guarda en 3 tablas (transacción)

Los 3 `INSERT` van dentro de una **transacción**: si cualquiera falla, se deshacen todos. Así nunca queda una persona guardada a medias, sin usuario.

```
begin_transaction()
   1. INSERT INTO persona      (cedula, nombre, apellido, fecha_nacimiento, email)
   2. INSERT INTO funcionario  (id_persona, cargo, sector, activo)
   3. INSERT INTO usuario      (id_funcionario, nombre_usuario, password_hash, estado)
commit()     ← recién acá queda guardado de verdad
```

Qué dato va a qué columna:

| Dato del formulario | Tabla | Columna |
|---|---|---|
| CI | `persona` | `cedula` |
| Nombre | `persona` | `nombre` |
| Apellido | `persona` | `apellido` |
| Fecha de nacimiento | `persona` | `fecha_nacimiento` |
| Email | `persona` | `email` |
| — (automático) | `funcionario` | `cargo` = `"Sin asignar"`, `sector` = `"Sin asignar"`, `activo` = `1` |
| Usuario | `usuario` | `nombre_usuario` |
| Contraseña | `usuario` | `password_hash` (cifrada, ver abajo) |
| — (automático) | `usuario` | `estado` = `"ACTIVO"`, `fecha_creacion` = ahora |

El `id_persona` que genera el paso 1 se reutiliza en los pasos 2 y 3. Así quedan las 3 filas conectadas.

**Si la cédula ya estaba cargada** (por ejemplo, un funcionario agregado desde Gestión), no se crea otra persona. Se usa la existente y solo se crea lo que falta.

### Paso 5 — La respuesta

```json
{ "success": true, "message": "Usuario registrado correctamente.", "id_usuario": 4 }
```

El JS muestra el mensaje en verde y a los 1,5 segundos te lleva al login.

---

## 5. La contraseña nunca se guarda tal cual

Al registrarse, la contraseña se transforma con `password_hash()`:

```
MiClave.2026   →   $2y$10$Xk3...  (un texto largo de 60 caracteres, distinto cada vez)
```

Ese texto no se puede "deshacer". Al iniciar sesión, `login.php` usa `password_verify()` para comparar lo que escribiste con el hash. Si alguien ve la base, no puede leer las contraseñas.

---

## 6. El inicio de sesión y la sesión

`php/login.php`:

1. Busca la fila de `usuario` por `nombre_usuario`.
2. Verifica la contraseña con `password_verify()`.
3. Verifica que `estado` sea `ACTIVO`.
4. Actualiza `ultimo_acceso`.
5. Guarda en la **sesión** de PHP quién entró:

```php
$_SESSION['id_usuario']     // id de la cuenta
$_SESSION['id_funcionario'] // id de la persona (sirve para saber quién crea encuestas, documentos, etc.)
$_SESSION['nombre_usuario']
```

Los PHP que necesitan saber quién está conectado (crear encuestas, configuración) leen esos valores con `session_start()`.

---

## 7. Cómo ver los datos guardados

1. Abrí **phpMyAdmin**: <http://localhost:880/phpmyadmin>
2. Entrá a la base `altf4` y abrí una tabla para ver sus filas.
3. Para ver a una persona con su cuenta, andá a la pestaña **SQL** y ejecutá:

```sql
SELECT p.cedula, p.nombre, p.apellido, p.email,
       f.cargo, f.sector,
       u.nombre_usuario, u.estado, u.fecha_creacion
FROM persona p
JOIN funcionario f ON f.id_persona = p.id_persona
JOIN usuario u     ON u.id_funcionario = f.id_persona
ORDER BY u.fecha_creacion DESC;
```

---

## 8. ⚠️ Cuidado con `database.sql`

`base-de-datos/database.sql` empieza con `USE altf4;` y después **`DROP TABLE` de todas las tablas**. Si lo importás, **se borra todo lo que tengas cargado** y queda solo lo que trae el archivo.

Antes de importarlo, o antes de cualquier cambio grande, hacé una copia de seguridad desde la terminal:

```bash
/opt/lampp/bin/mysqldump -uroot altf4 > ~/backup-altf4-$(date +%F).sql
```

Para volver a esa copia:

```bash
/opt/lampp/bin/mysql -uroot altf4 < ~/backup-altf4-2026-10-15.sql
```

(Cambiá la fecha por la del archivo que quieras restaurar.)

Para **agregar** cosas sin borrar nada, seguí la [guía para agregar tablas](guia-agregar-tablas.md).
