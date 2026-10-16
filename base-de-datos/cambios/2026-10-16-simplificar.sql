-- Simplificación de Gestión y Traslados (16/10/2026).
-- Ejecutar después de los archivos del 15/10 y de 2026-10-16-rutas.sql.
--
-- 1. Se quitan de Gestión los campos demasiado específicos (grupo sanguíneo, registro MSP, etc.).
-- 2. Se agregan destinos del interior (circuito nacional) y personal acompañante.
-- 3. Se rehace la tabla de traslados con lo que pide la consigna. ATENCIÓN: borra los traslados cargados.

-- ---------- 1. Campos que ya no se usan ----------
ALTER TABLE `gestion_paciente`
  DROP COLUMN IF EXISTS `estado`, DROP COLUMN IF EXISTS `habitacion`, DROP COLUMN IF EXISTS `servicio`,
  DROP COLUMN IF EXISTS `medico`, DROP COLUMN IF EXISTS `especialidad_medico`, DROP COLUMN IF EXISTS `fecha_ingreso`,
  DROP COLUMN IF EXISTS `grupo_sanguineo`, DROP COLUMN IF EXISTS `alergias`, DROP COLUMN IF EXISTS `diagnostico`,
  DROP COLUMN IF EXISTS `estado_clinico`, DROP COLUMN IF EXISTS `contacto_nombre`, DROP COLUMN IF EXISTS `contacto_telefono`,
  DROP COLUMN IF EXISTS `contacto_parentesco`;

-- El título (Dr./Dra.) pasa a ser parte del nombre, y el estado queda en Activo o Inactivo
UPDATE `gestion_medico` SET `nombre` = CONCAT(`titulo`, ' ', `nombre`) WHERE `titulo` IS NOT NULL AND `titulo` <> '' AND `nombre` NOT LIKE 'Dr%';
UPDATE `gestion_medico` SET `estado` = 'Activo' WHERE `estado` <> 'Inactivo';
ALTER TABLE `gestion_medico`
  DROP COLUMN IF EXISTS `titulo`, DROP COLUMN IF EXISTS `documento`, DROP COLUMN IF EXISTS `registro_msp`,
  DROP COLUMN IF EXISTS `servicio`, DROP COLUMN IF EXISTS `consultorio`, DROP COLUMN IF EXISTS `email`,
  DROP COLUMN IF EXISTS `turno`, DROP COLUMN IF EXISTS `dias`, DROP COLUMN IF EXISTS `hora_inicio`,
  DROP COLUMN IF EXISTS `hora_fin`, DROP COLUMN IF EXISTS `observaciones`;
ALTER TABLE `gestion_medico` MODIFY `estado` varchar(20) NOT NULL COMMENT 'Activo o Inactivo';

UPDATE `gestion_personal` SET `rol` = 'Acompañante' WHERE `rol` = 'Copiloto';
ALTER TABLE `gestion_personal` DROP COLUMN IF EXISTS `licencia`;
ALTER TABLE `gestion_personal` MODIFY `rol` varchar(20) NOT NULL COMMENT 'Chofer o Acompañante';

ALTER TABLE `gestion_destino`
  DROP COLUMN IF EXISTS `tipo`, DROP COLUMN IF EXISTS `telefono`, DROP COLUMN IF EXISTS `referencia`;

-- ---------- 2. Datos nuevos ----------
INSERT IGNORE INTO `gestion_personal` (`id_gestion_personal`, `codigo`, `nombre`, `rol`, `telefono`, `documento`, `estado`) VALUES
  (20, 'seed-20', 'Ana Gómez', 'Acompañante', '099 456 789', '', 'Activo'),
  (21, 'seed-21', 'Martín Silva', 'Acompañante', '098 222 333', '', 'Activo'),
  (22, 'seed-22', 'Lucía Pereira', 'Acompañante', '097 111 444', '', 'Activo');

-- Hospitales del interior (coordenadas aproximadas)
INSERT IGNORE INTO `gestion_destino` (`id_gestion_destino`, `codigo`, `nombre`, `direccion`, `localidad`, `estado`, `latitud`, `longitud`) VALUES
  (9, 'seed-9', 'Hospital Escuela del Litoral', 'Montevideo 1361', 'Paysandú', 'Activo', -32.317100, -58.080700),
  (10, 'seed-10', 'Hospital Regional Salto', 'Av. Juan H. Paiva s/n', 'Salto', 'Activo', -31.389300, -57.961200),
  (11, 'seed-11', 'Hospital Regional Tacuarembó', 'Treinta y Tres 444', 'Tacuarembó', 'Activo', -31.711000, -55.983000),
  (12, 'seed-12', 'Hospital de Maldonado', 'Ventura Alegre s/n', 'Maldonado', 'Activo', -34.907000, -54.953000),
  (13, 'seed-13', 'Hospital de Colonia', 'Av. Roosevelt s/n', 'Colonia', 'Activo', -34.470000, -57.844000);

-- Rutas del circuito nacional
INSERT IGNORE INTO `gestion_ruta` (`codigo`, `numero`, `nombre`, `categoria`, `sentido`, `estado`, `origen`, `destino`, `paradas`, `duracion_min`, `notas`) VALUES
  ('ruta-8', 'RT-008', 'Montevideo → Paysandú', 'Interhospitalario', 'Ida y vuelta', 'Activa', 'seed-1', 'seed-9', '["seed-13"]', 270, 'Por ruta 1 y ruta 2. Parada en Colonia.'),
  ('ruta-9', 'RT-009', 'Montevideo → Salto', 'Interhospitalario', 'Ida y vuelta', 'Activa', 'seed-1', 'seed-10', '[]', 360, 'Por ruta 3.'),
  ('ruta-10', 'RT-010', 'Montevideo → Tacuarembó', 'Interhospitalario', 'Ida y vuelta', 'Activa', 'seed-1', 'seed-11', '[]', 270, 'Por ruta 5.'),
  ('ruta-11', 'RT-011', 'Montevideo → Maldonado', 'Interhospitalario', 'Ida y vuelta', 'Activa', 'seed-1', 'seed-12', '[]', 105, 'Por ruta Interbalnearia.');

-- ---------- 3. Traslados ----------
DROP TABLE IF EXISTS `gestion_traslado`;

CREATE TABLE `gestion_traslado` (
  `id_gestion_traslado` int(11) NOT NULL AUTO_INCREMENT,
  `id_ambulancia` int(11) NOT NULL,
  `id_chofer` int(11) NOT NULL COMMENT 'gestion_personal (conductor)',
  `id_acompanante` int(11) DEFAULT NULL COMMENT 'gestion_personal (copiloto o acompañante)',
  `id_gestion_paciente` int(11) DEFAULT NULL COMMENT 'paciente trasladado (opcional)',
  `elemento` varchar(150) DEFAULT NULL COMMENT 'qué se traslada si no es un paciente',
  `id_origen` int(11) NOT NULL COMMENT 'gestion_destino',
  `id_destino` int(11) NOT NULL COMMENT 'gestion_destino',
  `salida_programada` datetime NOT NULL,
  `llegada_estimada` datetime DEFAULT NULL,
  `salida_real` datetime DEFAULT NULL,
  `llegada_real` datetime DEFAULT NULL,
  `retorno_real` datetime DEFAULT NULL COMMENT 'cuando volvió al hospital',
  `estado` varchar(20) NOT NULL DEFAULT 'PROGRAMADO' COMMENT 'PROGRAMADO, EN_CAMINO, EN_DESTINO, RETORNANDO, FINALIZADO o CANCELADO',
  `notas` varchar(300) DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_gestion_traslado`),
  KEY `idx_traslado_estado` (`estado`),
  CONSTRAINT `fk_traslado_ambulancia` FOREIGN KEY (`id_ambulancia`) REFERENCES `ambulancia` (`id_ambulancia`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_traslado_chofer` FOREIGN KEY (`id_chofer`) REFERENCES `gestion_personal` (`id_gestion_personal`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_traslado_acompanante` FOREIGN KEY (`id_acompanante`) REFERENCES `gestion_personal` (`id_gestion_personal`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_traslado_paciente` FOREIGN KEY (`id_gestion_paciente`) REFERENCES `gestion_paciente` (`id_gestion_paciente`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_traslado_origen` FOREIGN KEY (`id_origen`) REFERENCES `gestion_destino` (`id_gestion_destino`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_traslado_destino` FOREIGN KEY (`id_destino`) REFERENCES `gestion_destino` (`id_gestion_destino`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

INSERT INTO `gestion_traslado`
  (`id_gestion_traslado`, `id_ambulancia`, `id_chofer`, `id_acompanante`, `id_gestion_paciente`, `elemento`, `id_origen`, `id_destino`,
   `salida_programada`, `llegada_estimada`, `salida_real`, `llegada_real`, `retorno_real`, `estado`, `notas`)
VALUES
  (1, 1, 2, 20, 4, NULL, 1, 9, '2026-10-16 08:00:00', '2026-10-16 12:30:00', '2026-10-16 08:05:00', NULL, NULL, 'EN_CAMINO', 'Control en el Hospital Escuela del Litoral.'),
  (2, 2, 5, NULL, NULL, 'Muestras de laboratorio', 1, 7, '2026-10-16 15:00:00', '2026-10-16 15:20:00', NULL, NULL, NULL, 'PROGRAMADO', NULL),
  (3, 4, 6, 21, 2, NULL, 1, 3, '2026-10-16 10:00:00', '2026-10-16 10:20:00', '2026-10-16 10:02:00', '2026-10-16 10:21:00', NULL, 'EN_DESTINO', NULL),
  (4, 8, 12, 21, 5, NULL, 1, 10, '2026-10-15 06:00:00', '2026-10-15 12:00:00', '2026-10-15 06:10:00', '2026-10-15 12:05:00', NULL, 'RETORNANDO', NULL),
  (5, 6, 3, 22, 7, NULL, 1, 12, '2026-10-15 09:00:00', '2026-10-15 10:45:00', '2026-10-15 09:00:00', '2026-10-15 10:50:00', '2026-10-15 13:10:00', 'FINALIZADO', NULL),
  (6, 2, 5, NULL, NULL, 'Ecógrafo portátil', 1, 2, '2026-10-14 10:00:00', '2026-10-14 10:30:00', '2026-10-14 10:00:00', '2026-10-14 10:35:00', '2026-10-14 11:20:00', 'FINALIZADO', NULL),
  (7, 4, 6, NULL, 10, NULL, 1, 4, '2026-10-14 15:00:00', '2026-10-14 15:15:00', NULL, NULL, NULL, 'CANCELADO', 'El paciente reprogramó.');
