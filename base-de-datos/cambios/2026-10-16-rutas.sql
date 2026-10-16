-- Rutas simplificadas: el origen, el destino y las paradas se eligen de los Destinos de Gestión
-- (así tienen coordenadas para el mapa y la distancia se calcula sola).
--
-- ATENCIÓN: rehace la tabla gestion_ruta. Las rutas que hayas cargado a mano se pierden
-- (antes guardaban origen y destino como texto y no se pueden pasar a destinos automáticamente).
-- Necesita gestion_destino (2026-10-15-gestion.sql).

DROP TABLE IF EXISTS `gestion_ruta`;

CREATE TABLE `gestion_ruta` (
  `id_gestion_ruta` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(40) NOT NULL COMMENT 'id que usa el JS',
  `numero` varchar(10) NOT NULL COMMENT 'Ej. RT-001',
  `nombre` varchar(150) NOT NULL,
  `categoria` varchar(40) NOT NULL COMMENT 'Interhospitalario, Consulta, Tratamiento o Alta',
  `sentido` varchar(20) NOT NULL COMMENT 'Solo ida o Ida y vuelta',
  `estado` varchar(20) NOT NULL COMMENT 'Activa o Inactiva',
  `origen` varchar(40) NOT NULL COMMENT 'codigo de gestion_destino',
  `destino` varchar(40) NOT NULL COMMENT 'codigo de gestion_destino',
  `paradas` varchar(400) DEFAULT NULL COMMENT 'codigos de gestion_destino en orden, en JSON: ["seed-7", "seed-4"]',
  `duracion_min` int(11) NOT NULL,
  `notas` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id_gestion_ruta`),
  UNIQUE KEY `uq_gestion_ruta_codigo` (`codigo`),
  UNIQUE KEY `uq_gestion_ruta_numero` (`numero`),
  KEY `idx_ruta_origen` (`origen`),
  KEY `idx_ruta_destino` (`destino`),
  CONSTRAINT `fk_ruta_origen` FOREIGN KEY (`origen`) REFERENCES `gestion_destino` (`codigo`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_ruta_destino` FOREIGN KEY (`destino`) REFERENCES `gestion_destino` (`codigo`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

-- Rutas de ejemplo entre los destinos de ejemplo
-- (seed-1 Clínicas, seed-2 Maciel, seed-3 Pasteur, seed-4 Sanatorio Central, seed-5 Centro de Rehabilitación,
--  seed-6 Policlínica Las Piedras, seed-7 Centro de Diagnóstico, seed-8 Laboratorio Central)
INSERT INTO `gestion_ruta`
  (`id_gestion_ruta`, `codigo`, `numero`, `nombre`, `categoria`, `sentido`, `estado`, `origen`, `destino`, `paradas`, `duracion_min`, `notas`)
VALUES
  (1, 'ruta-1', 'RT-001', 'Clínicas → Hospital Maciel', 'Interhospitalario', 'Solo ida', 'Activa', 'seed-1', 'seed-2', '[]', 25, 'Salida por el acceso de ambulancias.'),
  (2, 'ruta-2', 'RT-002', 'Circuito de rehabilitación', 'Tratamiento', 'Ida y vuelta', 'Activa', 'seed-1', 'seed-5', '["seed-7"]', 35, 'Confirmar el punto de encuentro antes de salir.'),
  (3, 'ruta-3', 'RT-003', 'Clínicas → Hospital Pasteur', 'Interhospitalario', 'Solo ida', 'Activa', 'seed-1', 'seed-3', '[]', 18, NULL),
  (4, 'ruta-4', 'RT-004', 'Consulta · Sanatorio Central', 'Consulta', 'Ida y vuelta', 'Activa', 'seed-1', 'seed-4', '[]', 15, 'Coordinar el regreso al terminar la consulta.'),
  (5, 'ruta-5', 'RT-005', 'Alta · Policlínica Las Piedras', 'Alta', 'Solo ida', 'Activa', 'seed-1', 'seed-6', '[]', 40, NULL),
  (6, 'ruta-6', 'RT-006', 'Circuito de estudios', 'Consulta', 'Ida y vuelta', 'Activa', 'seed-1', 'seed-3', '["seed-7", "seed-4"]', 45, 'Pasa por el Centro de Diagnóstico y el Sanatorio Central.'),
  (7, 'ruta-7', 'RT-007', 'Muestras al Laboratorio Central', 'Tratamiento', 'Solo ida', 'Inactiva', 'seed-1', 'seed-8', '[]', 5, 'Laboratorio temporalmente cerrado.');
