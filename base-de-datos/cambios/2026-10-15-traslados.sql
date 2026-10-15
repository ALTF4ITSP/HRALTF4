-- Traslados de ambulancias guardados en la base + coordenadas de los destinos para el mapa.
-- Necesita las tablas de Gestión (2026-10-15-gestion.sql). No borra nada.

-- 1. Coordenadas de los destinos (aproximadas). Un destino sin coordenadas no aparece en el mapa.
ALTER TABLE `gestion_destino`
  ADD COLUMN IF NOT EXISTS `latitud` decimal(9,6) DEFAULT NULL AFTER `estado`,
  ADD COLUMN IF NOT EXISTS `longitud` decimal(9,6) DEFAULT NULL AFTER `latitud`;

UPDATE `gestion_destino` SET `latitud` = -34.893000, `longitud` = -56.153000 WHERE `codigo` = 'seed-1' AND `latitud` IS NULL;
UPDATE `gestion_destino` SET `latitud` = -34.906700, `longitud` = -56.208500 WHERE `codigo` = 'seed-2' AND `latitud` IS NULL;
UPDATE `gestion_destino` SET `latitud` = -34.871700, `longitud` = -56.141600 WHERE `codigo` = 'seed-3' AND `latitud` IS NULL;
UPDATE `gestion_destino` SET `latitud` = -34.900500, `longitud` = -56.174500 WHERE `codigo` = 'seed-4' AND `latitud` IS NULL;
UPDATE `gestion_destino` SET `latitud` = -34.855000, `longitud` = -56.100000 WHERE `codigo` = 'seed-5' AND `latitud` IS NULL;
UPDATE `gestion_destino` SET `latitud` = -34.727000, `longitud` = -56.219000 WHERE `codigo` = 'seed-6' AND `latitud` IS NULL;
UPDATE `gestion_destino` SET `latitud` = -34.893500, `longitud` = -56.164000 WHERE `codigo` = 'seed-7' AND `latitud` IS NULL;
UPDATE `gestion_destino` SET `latitud` = -34.892800, `longitud` = -56.152000 WHERE `codigo` = 'seed-8' AND `latitud` IS NULL;

-- 2. Traslados. Usa las ambulancias, el personal, los destinos y los pacientes de Gestión.
CREATE TABLE IF NOT EXISTS `gestion_traslado` (
  `id_gestion_traslado` int(11) NOT NULL AUTO_INCREMENT,
  `id_ambulancia` int(11) NOT NULL,
  `id_chofer` int(11) NOT NULL COMMENT 'gestion_personal',
  `id_acompanante` int(11) DEFAULT NULL COMMENT 'gestion_personal',
  `id_origen` int(11) NOT NULL COMMENT 'gestion_destino',
  `id_destino` int(11) NOT NULL COMMENT 'gestion_destino',
  `id_gestion_paciente` int(11) DEFAULT NULL,
  `tipo` varchar(20) NOT NULL COMMENT 'PACIENTE, EQUIPO o BIOLOGICO',
  `motivo` varchar(100) NOT NULL,
  `prioridad` varchar(20) NOT NULL COMMENT 'BAJA, NORMAL, ALTA o CRITICA',
  `estado` varchar(20) NOT NULL DEFAULT 'ASIGNADO' COMMENT 'ASIGNADO, EN_CURSO, EN_DESTINO, FINALIZADO o CANCELADO',
  `fecha_salida` datetime NOT NULL,
  `llegada_estimada` datetime DEFAULT NULL,
  `fecha_fin` datetime DEFAULT NULL COMMENT 'cuando se finalizó o canceló',
  `opciones` varchar(300) DEFAULT NULL COMMENT 'Opciones adicionales marcadas, separadas por coma',
  `notas` varchar(500) DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_gestion_traslado`),
  KEY `idx_traslado_estado` (`estado`),
  KEY `idx_traslado_ambulancia` (`id_ambulancia`),
  KEY `idx_traslado_chofer` (`id_chofer`),
  KEY `idx_traslado_acompanante` (`id_acompanante`),
  KEY `idx_traslado_origen` (`id_origen`),
  KEY `idx_traslado_destino` (`id_destino`),
  KEY `idx_traslado_paciente` (`id_gestion_paciente`),
  CONSTRAINT `fk_traslado_ambulancia` FOREIGN KEY (`id_ambulancia`) REFERENCES `ambulancia` (`id_ambulancia`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_traslado_chofer` FOREIGN KEY (`id_chofer`) REFERENCES `gestion_personal` (`id_gestion_personal`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_traslado_acompanante` FOREIGN KEY (`id_acompanante`) REFERENCES `gestion_personal` (`id_gestion_personal`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_traslado_origen` FOREIGN KEY (`id_origen`) REFERENCES `gestion_destino` (`id_gestion_destino`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_traslado_destino` FOREIGN KEY (`id_destino`) REFERENCES `gestion_destino` (`id_gestion_destino`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_traslado_paciente` FOREIGN KEY (`id_gestion_paciente`) REFERENCES `gestion_paciente` (`id_gestion_paciente`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

INSERT IGNORE INTO `gestion_traslado`
  (`id_gestion_traslado`, `id_ambulancia`, `id_chofer`, `id_acompanante`, `id_origen`, `id_destino`, `id_gestion_paciente`,
   `tipo`, `motivo`, `prioridad`, `estado`, `fecha_salida`, `llegada_estimada`, `fecha_fin`, `opciones`, `notas`, `fecha_creacion`)
VALUES
  (1, 1, 2, 3, 1, 2, 4, 'PACIENTE', 'Estudio o tratamiento', 'ALTA', 'EN_CURSO', '2026-10-15 09:30:00', '2026-10-15 10:00:00', NULL, 'Requiere equipamiento especial', 'Monitor cardíaco y oxígeno.', '2026-10-15 08:50:00'),
  (2, 2, 5, NULL, 1, 7, NULL, 'EQUIPO', 'Traslado de insumos', 'NORMAL', 'ASIGNADO', '2026-10-15 16:00:00', '2026-10-15 16:20:00', NULL, NULL, 'Retirar el ecógrafo en recepción.', '2026-10-15 09:10:00'),
  (3, 4, 6, NULL, 1, 3, NULL, 'BIOLOGICO', 'Traslado de insumos', 'ALTA', 'EN_DESTINO', '2026-10-15 11:00:00', '2026-10-15 11:25:00', NULL, NULL, 'Muestras refrigeradas.', '2026-10-15 10:30:00'),
  (4, 6, 3, 2, 1, 4, 2, 'PACIENTE', 'Consulta médica', 'NORMAL', 'FINALIZADO', '2026-10-14 08:00:00', '2026-10-14 08:25:00', '2026-10-14 08:40:00', 'Acompañado por familiar', NULL, '2026-10-13 17:00:00'),
  (5, 1, 2, NULL, 1, 6, 7, 'PACIENTE', 'Alta médica', 'BAJA', 'FINALIZADO', '2026-10-13 14:00:00', '2026-10-13 14:45:00', '2026-10-13 14:50:00', NULL, NULL, '2026-10-13 11:20:00'),
  (6, 8, 5, NULL, 1, 2, NULL, 'EQUIPO', 'Traslado de insumos', 'NORMAL', 'FINALIZADO', '2026-10-12 10:00:00', '2026-10-12 10:30:00', '2026-10-12 10:35:00', NULL, NULL, '2026-10-12 08:00:00'),
  (7, 2, 6, NULL, 1, 7, NULL, 'BIOLOGICO', 'Estudio o tratamiento', 'NORMAL', 'CANCELADO', '2026-10-12 15:00:00', '2026-10-12 15:20:00', '2026-10-12 13:00:00', NULL, 'Se canceló: el laboratorio reprogramó.', '2026-10-12 09:00:00');
