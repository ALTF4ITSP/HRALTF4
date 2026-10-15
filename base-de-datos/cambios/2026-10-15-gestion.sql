-- Tablas de las pantallas de Gestión (pacientes, médicos, personal, destinos y rutas).
-- Las ambulancias de Gestión usan la tabla `ambulancia`, que ya existía.
-- Se puede ejecutar en una base que ya tiene datos: no borra nada.
-- Los datos de ejemplo se cargan después con el archivo 2026-10-15-gestion-datos.sql.

-- `codigo` guarda el id que usa el JS (por ejemplo "p-001").

CREATE TABLE IF NOT EXISTS `gestion_paciente` (
  `id_gestion_paciente` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(40) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `edad` int(11) DEFAULT NULL,
  `documento` varchar(20) NOT NULL,
  `telefono` varchar(30) DEFAULT NULL,
  `estado` varchar(20) NOT NULL COMMENT 'Internado, Ambulatorio o Urgencias',
  `habitacion` varchar(100) DEFAULT NULL,
  `servicio` varchar(100) DEFAULT NULL,
  `medico` varchar(150) DEFAULT NULL,
  `especialidad_medico` varchar(100) DEFAULT NULL,
  `fecha_ingreso` varchar(40) DEFAULT NULL,
  `grupo_sanguineo` varchar(5) DEFAULT NULL,
  `alergias` varchar(300) DEFAULT NULL,
  `diagnostico` varchar(300) DEFAULT NULL,
  `estado_clinico` varchar(60) DEFAULT NULL,
  `contacto_nombre` varchar(150) DEFAULT NULL,
  `contacto_telefono` varchar(30) DEFAULT NULL,
  `contacto_parentesco` varchar(60) DEFAULT NULL,
  PRIMARY KEY (`id_gestion_paciente`),
  UNIQUE KEY `uq_gestion_paciente_codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

CREATE TABLE IF NOT EXISTS `gestion_medico` (
  `id_gestion_medico` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(40) NOT NULL,
  `titulo` varchar(10) DEFAULT NULL COMMENT 'Dr. o Dra.',
  `nombre` varchar(150) NOT NULL,
  `documento` varchar(20) NOT NULL,
  `registro_msp` varchar(30) NOT NULL,
  `especialidad` varchar(100) NOT NULL,
  `servicio` varchar(100) NOT NULL,
  `consultorio` varchar(100) DEFAULT NULL,
  `telefono` varchar(30) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `estado` varchar(20) NOT NULL COMMENT 'Disponible, En consulta, De guardia o Inactivo',
  `turno` varchar(20) DEFAULT NULL,
  `dias` varchar(100) DEFAULT NULL,
  `hora_inicio` varchar(5) DEFAULT NULL,
  `hora_fin` varchar(5) DEFAULT NULL,
  `observaciones` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id_gestion_medico`),
  UNIQUE KEY `uq_gestion_medico_codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

CREATE TABLE IF NOT EXISTS `gestion_personal` (
  `id_gestion_personal` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(40) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `rol` varchar(20) NOT NULL COMMENT 'Chofer o Copiloto',
  `telefono` varchar(30) DEFAULT NULL,
  `documento` varchar(20) DEFAULT NULL,
  `licencia` varchar(30) DEFAULT NULL,
  `estado` varchar(20) NOT NULL COMMENT 'Activo o Inactivo',
  PRIMARY KEY (`id_gestion_personal`),
  UNIQUE KEY `uq_gestion_personal_codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

CREATE TABLE IF NOT EXISTS `gestion_destino` (
  `id_gestion_destino` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(40) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `direccion` varchar(200) NOT NULL,
  `localidad` varchar(100) NOT NULL,
  `tipo` varchar(40) NOT NULL,
  `telefono` varchar(30) DEFAULT NULL,
  `referencia` varchar(500) DEFAULT NULL,
  `estado` varchar(20) NOT NULL COMMENT 'Activo o Inactivo',
  PRIMARY KEY (`id_gestion_destino`),
  UNIQUE KEY `uq_gestion_destino_codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

CREATE TABLE IF NOT EXISTS `gestion_ruta` (
  `id_gestion_ruta` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(40) NOT NULL,
  `numero` varchar(10) NOT NULL COMMENT 'Ej. RT-001',
  `nombre` varchar(150) NOT NULL,
  `categoria` varchar(40) NOT NULL,
  `sentido` varchar(20) NOT NULL COMMENT 'Solo ida o Ida y vuelta',
  `estado` varchar(20) NOT NULL COMMENT 'Activa o Inactiva',
  `origen_nombre` varchar(150) NOT NULL,
  `origen_direccion` varchar(200) NOT NULL,
  `destino_nombre` varchar(150) NOT NULL,
  `destino_direccion` varchar(200) NOT NULL,
  `paradas` text DEFAULT NULL COMMENT 'Lista en JSON: [{"name": "...", "address": "..."}]',
  `distancia_km` decimal(7,1) NOT NULL,
  `duracion_min` int(11) NOT NULL,
  `notas` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id_gestion_ruta`),
  UNIQUE KEY `uq_gestion_ruta_codigo` (`codigo`),
  UNIQUE KEY `uq_gestion_ruta_numero` (`numero`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;
