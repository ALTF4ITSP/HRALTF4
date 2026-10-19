-- Limpieza de la base (19/10/2026). Ejecutar después de 2026-10-16-destino-casa.sql.
--
-- 1. carga_transportada pasa a guardar QUÉ LLEVA cada traslado: Paciente, Elemento biológico u Otro.
--    (Antes colgaba de solicitud_traslado, una tabla del primer diseño que no usaba ninguna página.)
-- 2. Se borran las tablas del primer diseño que ninguna página usa.
-- 3. Quedan 5 rutas predeterminadas, todas en Montevideo.

-- ---------- 1. Carga transportada ----------
DELETE FROM `carga_transportada`;   -- eran ejemplos de las solicitudes viejas
ALTER TABLE `carga_transportada`
  DROP FOREIGN KEY `fk_carga_solicitud`,
  DROP INDEX `idx_carga_solicitud`,
  DROP COLUMN `id_solicitud`, DROP COLUMN `cantidad`, DROP COLUMN `unidad`, DROP COLUMN `condiciones_especiales`,
  ADD COLUMN `id_gestion_traslado` int(11) NOT NULL AFTER `id_carga`,
  MODIFY `tipo` varchar(30) NOT NULL COMMENT 'Paciente, Elemento biológico u Otro',
  MODIFY `descripcion` varchar(150) DEFAULT NULL COMMENT 'qué se lleva (si no es un paciente)',
  ADD UNIQUE KEY `uq_carga_traslado` (`id_gestion_traslado`),
  ADD CONSTRAINT `fk_carga_traslado` FOREIGN KEY (`id_gestion_traslado`)
    REFERENCES `gestion_traslado` (`id_gestion_traslado`) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE `carga_transportada` AUTO_INCREMENT = 1;

-- La carga de los traslados que ya existen sale de gestion_traslado
INSERT INTO `carga_transportada` (`id_gestion_traslado`, `tipo`, `descripcion`)
SELECT `id_gestion_traslado`,
       CASE WHEN `id_gestion_paciente` IS NOT NULL THEN 'Paciente'
            WHEN `elemento` LIKE '%muestra%' OR `elemento` LIKE '%sangre%' THEN 'Elemento biológico'
            ELSE 'Otro' END,
       `elemento`
FROM `gestion_traslado` ORDER BY `id_gestion_traslado`;

ALTER TABLE `gestion_traslado` DROP COLUMN `elemento`;   -- ahora está en carga_transportada

-- ---------- 2. Tablas del primer diseño que no se usan ----------
DROP TABLE IF EXISTS `historial_estado`, `traslado`, `solicitud_traslado`, `ruta`, `paciente`;

-- ---------- 3. Rutas: 5 predeterminadas en Montevideo ----------
DELETE FROM `gestion_ruta` WHERE `codigo` NOT IN ('ruta-1', 'ruta-2', 'ruta-3', 'ruta-4', 'ruta-7');
UPDATE `gestion_ruta` SET `numero` = 'RT-005', `estado` = 'Activa' WHERE `codigo` = 'ruta-7';

-- Los destinos de las rutas predeterminadas tienen que estar activos para poder elegirlos en un traslado
UPDATE `gestion_destino` SET `estado` = 'Activo' WHERE `codigo` IN ('seed-5', 'seed-8');

-- ---------- 4. Sin modo claro/oscuro ----------
ALTER TABLE `configuracion_usuario` DROP COLUMN IF EXISTS `tema`;
