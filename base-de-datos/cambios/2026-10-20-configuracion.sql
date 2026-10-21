-- Configuración más simple (20/10/2026). Ejecutar después de 2026-10-19-limpieza.sql.
-- Se quitan las opciones que se guardaban pero no hacían nada (análisis de rendimiento,
-- notificaciones de seguridad, cerrar sesión automáticamente y visibilidad de la foto).
-- El idioma ahora lo recuerda el navegador (js/idioma.js), así que tampoco se guarda acá.
ALTER TABLE `configuracion_usuario`
  DROP COLUMN IF EXISTS `foto_publica`,
  DROP COLUMN IF EXISTS `analisis_rendimiento`,
  DROP COLUMN IF EXISTS `notificaciones_seguridad`,
  DROP COLUMN IF EXISTS `cierre_sesion_automatico`,
  DROP COLUMN IF EXISTS `idioma`;
