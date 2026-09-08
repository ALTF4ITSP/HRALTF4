# API de documentos

## Rutas públicas

- `POST /api/documents/create.php`: crea un documento.
- `POST /api/documents/update.php`: actualiza un documento existente.

Los archivos dentro de `public/api/` son puertas de entrada mínimas. La lógica
real permanece fuera del directorio público, dentro de `backend/api/` y
`backend/php/`.

## Solicitud `multipart/form-data`

| Campo | Crear | Editar | Formato |
| --- | --- | --- | --- |
| `id_documento` | No | Sí | Entero positivo |
| `nombre` | Sí | Sí | Texto, máximo 150 caracteres |
| `paciente` | Sí | Sí | Nombre, cédula o referencia, máximo 80 caracteres |
| `fecha` | Sí | Sí | `YYYY-MM-DD` |
| `categoria` | Sí | Sí | `informe`, `estudio` o `administrativo` |
| `archivo` | Sí | Opcional | PDF, DOCX, JPG/JPEG o PNG; máximo 10 MB |

El servidor no confía en el nombre ni en el tipo declarado por el navegador:
valida el MIME real con Fileinfo, genera un nombre aleatorio y guarda el archivo
fuera de `public/`.

## Respuesta

Éxito:

```json
{
  "success": true,
  "data": {
    "id_documento": 1,
    "nombre": "Informe médico",
    "paciente": "1.234.567-8",
    "fecha_documento": "2026-09-08",
    "categoria": "informe",
    "archivo": {
      "nombre_original": "informe.pdf",
      "nombre_almacenado": "6d7a9c59fef34d178561d9db3e30eb50.pdf",
      "tipo_mime": "application/pdf",
      "tamano_bytes": 245760
    },
    "fecha_subida": "2026-09-08T20:15:00Z",
    "fecha_modificacion": "2026-09-08T20:15:00Z"
  }
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "validation_error",
    "message": "Revisá los datos ingresados.",
    "fields": {
      "fecha": "La fecha debe usar el formato YYYY-MM-DD."
    }
  }
}
```

## Persistencia

El controlador usa JSON de forma predeterminada (`db/json/documents.json`) y
bloquea el archivo durante cada escritura. Para MySQL:

1. Ejecutar `db/sql/documents.sql`.
2. Copiar los valores necesarios de `backend/config/documents.env.example` al
   entorno real del servidor.
3. Definir `DOCUMENT_STORAGE_DRIVER=pdo`.
4. Configurar `DOCUMENT_DB_DSN`, `DOCUMENT_DB_USER` y
   `DOCUMENT_DB_PASSWORD` fuera del repositorio.

Requisitos: PHP 7.4 o superior, extensiones Fileinfo y PDO; para el esquema SQL,
MySQL 8.0.16 o superior.

La autenticación, autorización por rol y protección CSRF deben conectarse al
sistema de sesiones definitivo antes de exponer estas rutas en producción. No
se inventó una sesión paralela porque el proyecto recibido todavía no incluye
su implementación de identidad.
