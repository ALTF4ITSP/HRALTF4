-- phpMyAdmin SQL Dump
-- Base de datos: altf4
-- Revisado y ampliado para el módulo de Configuración.
-- Compatible con MariaDB 10.4+ / MySQL 5.7+.

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS `altf4`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_spanish2_ci;

USE `altf4`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `gestion_traslado`;
DROP TABLE IF EXISTS `turno`;
DROP TABLE IF EXISTS `gestion_ruta`;
DROP TABLE IF EXISTS `gestion_destino`;
DROP TABLE IF EXISTS `gestion_personal`;
DROP TABLE IF EXISTS `gestion_medico`;
DROP TABLE IF EXISTS `gestion_paciente`;
DROP TABLE IF EXISTS `usuario_especializacion`;
DROP TABLE IF EXISTS `especializacion`;
DROP TABLE IF EXISTS `configuracion_usuario`;
DROP TABLE IF EXISTS `usuario`;
DROP TABLE IF EXISTS `traslado`;
DROP TABLE IF EXISTS `solicitud_traslado`;
DROP TABLE IF EXISTS `carga_transportada`;
DROP TABLE IF EXISTS `ruta`;
DROP TABLE IF EXISTS `historial_estado`;
DROP TABLE IF EXISTS `qr`;
DROP TABLE IF EXISTS `respuesta`;
DROP TABLE IF EXISTS `pregunta`;
DROP TABLE IF EXISTS `envio_encuesta`;
DROP TABLE IF EXISTS `encuesta`;
DROP TABLE IF EXISTS `servicio_hospitalario`;
DROP TABLE IF EXISTS `documento`;
DROP TABLE IF EXISTS `tipo_documento`;
DROP TABLE IF EXISTS `paciente`;
DROP TABLE IF EXISTS `funcionario`;
DROP TABLE IF EXISTS `persona`;
DROP TABLE IF EXISTS `ambulancia`;

CREATE TABLE `persona` (
  `id_persona` int(11) NOT NULL AUTO_INCREMENT,
  `cedula` varchar(20) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `fecha_nacimiento` date NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `direccion` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id_persona`),
  UNIQUE KEY `uq_persona_cedula` (`cedula`),
  KEY `idx_persona_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

INSERT INTO `persona`
  (`id_persona`, `cedula`, `nombre`, `apellido`, `fecha_nacimiento`, `email`, `telefono`, `direccion`)
VALUES
  (1, '45678901', 'Ana', 'Gomez', '1985-04-12', 'ana.gomez@hospital.com', '099123456', 'Av. Italia 123'),
  (2, '46789012', 'Carlos', 'Rodriguez', '1990-08-25', 'carlos.rodriguez@hospital.com', '098234567', 'Calle Rivera 456'),
  (3, '47890123', 'Lucia', 'Fernandez', '1988-11-03', 'lucia.fernandez@hospital.com', '097345678', 'Calle Artigas 789'),
  (4, '57606837', 'Emilia', 'Muniz', '2008-10-17', 'emiliamuniz1710@gmail.com', '099686880', 'Paysandú');

CREATE TABLE `funcionario` (
  `id_persona` int(11) NOT NULL,
  `legajo` varchar(20) DEFAULT NULL COMMENT 'Opcional: los funcionarios que se registran solos no tienen legajo',
  `cargo` varchar(100) NOT NULL,
  `sector` varchar(100) NOT NULL,
  `licencia_conducir` varchar(30) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id_persona`),
  UNIQUE KEY `uq_funcionario_legajo` (`legajo`),
  CONSTRAINT `fk_funcionario_persona`
    FOREIGN KEY (`id_persona`) REFERENCES `persona` (`id_persona`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

INSERT INTO `funcionario`
  (`id_persona`, `legajo`, `cargo`, `sector`, `licencia_conducir`, `activo`)
VALUES
  (1, 'LEG001', 'Chofer', 'Traslados', 'CAT-C', 1),
  (2, 'LEG002', 'Enfermero', 'Emergencia', NULL, 1),
  (3, 'LEG003', 'Administrativo', 'Documentación', NULL, 1),
  (4, 'PRUEBA001', 'Administrativo', 'Documentación', NULL, 1);

CREATE TABLE `ambulancia` (
  `id_ambulancia` int(11) NOT NULL AUTO_INCREMENT,
  `matricula` varchar(20) NOT NULL,
  `modelo` varchar(100) NOT NULL,
  `capacidad` int(11) NOT NULL,
  `estado_operativo` varchar(30) NOT NULL,
  PRIMARY KEY (`id_ambulancia`),
  UNIQUE KEY `uq_ambulancia_matricula` (`matricula`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

INSERT INTO `ambulancia`
  (`id_ambulancia`, `matricula`, `modelo`, `capacidad`, `estado_operativo`)
VALUES
  (1, 'SAB001', 'Mercedes-Benz Sprinter', 4, 'OPERATIVA'),
  (2, 'SAB002', 'Renault Master', 4, 'OPERATIVA'),
  (3, 'SAB003', 'Fiat Ducato', 3, 'MANTENIMIENTO'),
  (4, 'SAB004', 'Ford Transit', 5, 'OPERATIVA'),
  (5, 'SAB005', 'Peugeot Boxer', 4, 'FUERA_SERVICIO'),
  (6, 'SAB006', 'Mercedes-Benz Sprinter', 4, 'OPERATIVA'),
  (7, 'SAB007', 'Renault Master', 3, 'MANTENIMIENTO'),
  (8, 'SAB008', 'Fiat Ducato', 4, 'OPERATIVA');

CREATE TABLE `tipo_documento` (
  `id_tipo_documento` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(300) DEFAULT NULL,
  PRIMARY KEY (`id_tipo_documento`),
  UNIQUE KEY `uq_tipo_documento_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

INSERT INTO `tipo_documento` (`id_tipo_documento`, `nombre`, `descripcion`) VALUES
  (1, 'Informe médico', 'Informes realizados por profesionales de la salud'),
  (2, 'Estudio de Laboratorio', 'Resultados y órdenes de estudios de laboratorio'),
  (3, 'Documento Administrativo', 'Documentación administrativa de pacientes/hospital');

CREATE TABLE `documento` (
  `id_documento` int(11) NOT NULL AUTO_INCREMENT,
  `id_tipo_documento` int(11) NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `descripcion` varchar(500) DEFAULT NULL,
  `ruta_archivo` varchar(500) NOT NULL,
  `fecha_carga` datetime NOT NULL,
  `version` int(11) NOT NULL DEFAULT 1,
  `estado` varchar(30) NOT NULL,
  `id_funcionario_carga` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_documento`),
  KEY `idx_documento_tipo` (`id_tipo_documento`),
  KEY `idx_documento_funcionario` (`id_funcionario_carga`),
  CONSTRAINT `fk_documento_tipo`
    FOREIGN KEY (`id_tipo_documento`) REFERENCES `tipo_documento` (`id_tipo_documento`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_documento_funcionario`
    FOREIGN KEY (`id_funcionario_carga`) REFERENCES `funcionario` (`id_persona`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

-- Los documentos se crean desde la aplicación. No se cargan registros de
-- ejemplo porque sus archivos binarios no forman parte del repositorio.

CREATE TABLE `qr` (
  `id_qr` int(11) NOT NULL AUTO_INCREMENT,
  `id_documento` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `fecha_generacion` datetime NOT NULL,
  `fecha_expiracion` datetime DEFAULT NULL,
  `estado` varchar(30) NOT NULL,
  PRIMARY KEY (`id_qr`),
  UNIQUE KEY `uq_qr_token` (`token`),
  UNIQUE KEY `uq_qr_documento` (`id_documento`),
  CONSTRAINT `fk_qr_documento`
    FOREIGN KEY (`id_documento`) REFERENCES `documento` (`id_documento`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

CREATE TABLE `servicio_hospitalario` (
  `id_servicio` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(300) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id_servicio`),
  UNIQUE KEY `uq_servicio_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

INSERT INTO `servicio_hospitalario` (`id_servicio`, `nombre`, `descripcion`, `activo`) VALUES
  (1, 'Urgencias', 'Atención de urgencias hospitalarias', 1),
  (2, 'Laboratorio', 'Análisis y estudios de laboratorio', 1),
  (3, 'Administración', 'Gestión administrativa del hospital', 1),
  (4, 'Consultas externas', 'Atención médica ambulatoria', 1);

CREATE TABLE `encuesta` (
  `id_encuesta` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(200) NOT NULL,
  `descripcion` varchar(500) DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL,
  `estado` varchar(30) NOT NULL,
  `id_servicio` int(11) NOT NULL,
  `id_funcionario_crea` int(11) NOT NULL,
  PRIMARY KEY (`id_encuesta`),
  KEY `idx_encuesta_servicio` (`id_servicio`),
  KEY `idx_encuesta_funcionario` (`id_funcionario_crea`),
  CONSTRAINT `fk_encuesta_servicio`
    FOREIGN KEY (`id_servicio`) REFERENCES `servicio_hospitalario` (`id_servicio`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_encuesta_funcionario`
    FOREIGN KEY (`id_funcionario_crea`) REFERENCES `funcionario` (`id_persona`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

INSERT INTO `encuesta`
  (`id_encuesta`, `titulo`, `descripcion`, `fecha_creacion`, `estado`, `id_servicio`, `id_funcionario_crea`)
VALUES
  (1, 'Encuesta de satisfacción', 'Evaluación de la satisfacción de los usuarios del hospital', '2026-09-08 10:07:32', 'ACTIVA', 1, 3),
  (2, 'Evaluación del servicio', 'Encuesta sobre la calidad de los servicios hospitalarios', '2026-09-08 10:07:32', 'ACTIVA', 2, 3);

CREATE TABLE `envio_encuesta` (
  `id_envio` int(11) NOT NULL AUTO_INCREMENT,
  `id_encuesta` int(11) NOT NULL,
  `id_persona` int(11) DEFAULT NULL,
  `fecha_hora` datetime NOT NULL,
  `completada` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_envio`),
  KEY `idx_envio_encuesta` (`id_encuesta`),
  KEY `idx_envio_persona` (`id_persona`),
  CONSTRAINT `fk_envio_encuesta`
    FOREIGN KEY (`id_encuesta`) REFERENCES `encuesta` (`id_encuesta`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_envio_persona`
    FOREIGN KEY (`id_persona`) REFERENCES `persona` (`id_persona`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

INSERT INTO `envio_encuesta`
  (`id_envio`, `id_encuesta`, `id_persona`, `fecha_hora`, `completada`)
VALUES
  (1, 1, 2, '2026-09-08 10:08:48', 1),
  (2, 1, NULL, '2026-09-08 10:08:48', 0),
  (3, 2, 3, '2026-09-08 10:08:48', 1);

CREATE TABLE `pregunta` (
  `id_pregunta` int(11) NOT NULL AUTO_INCREMENT,
  `id_encuesta` int(11) NOT NULL,
  `enunciado` varchar(500) NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `orden` int(11) NOT NULL,
  `obligatoria` tinyint(1) NOT NULL DEFAULT 1,
  `opciones` varchar(1000) DEFAULT NULL COMMENT 'Opciones de las preguntas tipo OPCION, una por línea',
  PRIMARY KEY (`id_pregunta`),
  KEY `idx_pregunta_encuesta` (`id_encuesta`),
  UNIQUE KEY `uq_pregunta_orden` (`id_encuesta`, `orden`),
  CONSTRAINT `fk_pregunta_encuesta`
    FOREIGN KEY (`id_encuesta`) REFERENCES `encuesta` (`id_encuesta`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

INSERT INTO `pregunta`
  (`id_pregunta`, `id_encuesta`, `enunciado`, `tipo`, `orden`, `obligatoria`)
VALUES
  (1, 1, '¿Qué tan satisfecho está con la atención recibida?', 'ESCALA', 1, 1),
  (2, 1, '¿Cómo calificaría la atención del personal?', 'ESCALA', 2, 1),
  (3, 1, '¿Tiene alguna sugerencia para mejorar el servicio?', 'TEXTO', 3, 0),
  (4, 2, '¿Cómo evaluaría la calidad del servicio?', 'ESCALA', 1, 1),
  (5, 2, '¿Recomendaría este servicio?', 'SI_NO', 2, 1);

CREATE TABLE `respuesta` (
  `id_respuesta` int(11) NOT NULL AUTO_INCREMENT,
  `id_envio` int(11) NOT NULL,
  `id_pregunta` int(11) NOT NULL,
  `respuesta_texto` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id_respuesta`),
  UNIQUE KEY `uq_respuesta_envio_pregunta` (`id_envio`, `id_pregunta`),
  KEY `idx_respuesta_pregunta` (`id_pregunta`),
  CONSTRAINT `fk_respuesta_envio`
    FOREIGN KEY (`id_envio`) REFERENCES `envio_encuesta` (`id_envio`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_respuesta_pregunta`
    FOREIGN KEY (`id_pregunta`) REFERENCES `pregunta` (`id_pregunta`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

INSERT INTO `respuesta`
  (`id_respuesta`, `id_envio`, `id_pregunta`, `respuesta_texto`)
VALUES
  (1, 1, 1, 'Muy satisfecho'),
  (2, 1, 2, 'Excelente'),
  (3, 1, 3, 'Todo estuvo muy bien'),
  (4, 3, 4, 'Muy bueno'),
  (5, 3, 5, 'Sí');

CREATE TABLE `usuario` (
  `id_usuario` int(11) NOT NULL AUTO_INCREMENT,
  `id_funcionario` int(11) NOT NULL,
  `nombre_usuario` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `estado` varchar(20) NOT NULL DEFAULT 'ACTIVO',
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `ultimo_acceso` datetime DEFAULT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `uq_usuario_funcionario` (`id_funcionario`),
  UNIQUE KEY `uq_usuario_nombre` (`nombre_usuario`),
  CONSTRAINT `fk_usuario_funcionario`
    FOREIGN KEY (`id_funcionario`) REFERENCES `funcionario` (`id_persona`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

INSERT INTO `usuario`
  (`id_usuario`, `id_funcionario`, `nombre_usuario`, `password_hash`, `estado`, `fecha_creacion`, `ultimo_acceso`)
VALUES
  (1, 4, 'emiliamuniz-17', '$2y$10$29nNMwQXtRw00xfIEU9/8eqXpXnDLqkz9KxYNP8z9WoH28hQWD.Hq', 'ACTIVO', '2026-09-09 18:42:18', NULL),
  (2, 2, 'Carlos.Rodriguez', '$2y$10$mxUBc4X52FgPqnl89vDr1.1bTw9DvIAYhd.DTTgiHNHmdkpHx3kEW', 'ACTIVO', '2026-09-09 19:19:09', '2026-09-09 19:19:41'),
  (3, 3, 'LuciaFernandez-1988', '$2y$10$q6S80yde/3pS2nrT4n2eoebdNddBEA5FjtuVgA65eO5UsX4JlBLg2', 'ACTIVO', '2026-09-10 09:11:12', '2026-09-10 09:12:24');

-- =========================================================
-- CONFIGURACIÓN DE USUARIOS
-- =========================================================

CREATE TABLE `configuracion_usuario` (
  `id_configuracion` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `centro` varchar(150) NOT NULL DEFAULT 'Hospital de Clínicas',
  `foto_perfil` varchar(500) DEFAULT NULL,
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_configuracion`),
  UNIQUE KEY `uq_configuracion_usuario` (`id_usuario`),
  CONSTRAINT `fk_configuracion_usuario`
    FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

INSERT INTO `configuracion_usuario`
  (`id_usuario`, `centro`, `foto_perfil`)
VALUES
  (1, 'Hospital de Clínicas', NULL),
  (2, 'Hospital de Clínicas', NULL),
  (3, 'Hospital de Clínicas', NULL);

CREATE TABLE `especializacion` (
  `id_especializacion` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id_especializacion`),
  UNIQUE KEY `uq_especializacion_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

CREATE TABLE `usuario_especializacion` (
  `id_usuario` int(11) NOT NULL,
  `id_especializacion` int(11) NOT NULL,
  PRIMARY KEY (`id_usuario`, `id_especializacion`),
  KEY `idx_usuario_especializacion_especializacion` (`id_especializacion`),
  CONSTRAINT `fk_usuario_especializacion_usuario`
    FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_usuario_especializacion_especializacion`
    FOREIGN KEY (`id_especializacion`) REFERENCES `especializacion` (`id_especializacion`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

-- Las especializaciones se administran desde la pantalla de Configuración.
-- No se insertan etiquetas de prueba de forma predeterminada.

-- =========================================================
-- PANTALLAS DE GESTIÓN
-- `codigo` guarda el id que usa el JS (por ejemplo "p-001").
-- Las ambulancias de Gestión usan la tabla `ambulancia`.
-- =========================================================

CREATE TABLE `gestion_paciente` (
  `id_gestion_paciente` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(40) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `edad` int(11) DEFAULT NULL,
  `documento` varchar(20) NOT NULL,
  `telefono` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id_gestion_paciente`),
  UNIQUE KEY `uq_gestion_paciente_codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

CREATE TABLE `gestion_medico` (
  `id_gestion_medico` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(40) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `especialidad` varchar(100) NOT NULL,
  `telefono` varchar(30) DEFAULT NULL,
  `estado` varchar(20) NOT NULL COMMENT 'Activo o Inactivo',
  PRIMARY KEY (`id_gestion_medico`),
  UNIQUE KEY `uq_gestion_medico_codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

CREATE TABLE `gestion_personal` (
  `id_gestion_personal` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(40) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `rol` varchar(20) NOT NULL COMMENT 'Chofer o Acompañante',
  `telefono` varchar(30) DEFAULT NULL,
  `documento` varchar(20) DEFAULT NULL,
  `estado` varchar(20) NOT NULL COMMENT 'Activo o Inactivo',
  PRIMARY KEY (`id_gestion_personal`),
  UNIQUE KEY `uq_gestion_personal_codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

CREATE TABLE `gestion_destino` (
  `id_gestion_destino` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(40) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `direccion` varchar(200) NOT NULL,
  `localidad` varchar(100) NOT NULL,
  `estado` varchar(20) NOT NULL COMMENT 'Activo o Inactivo',
  `latitud` decimal(9,6) DEFAULT NULL COMMENT 'Para el mapa de traslados (aproximada)',
  `longitud` decimal(9,6) DEFAULT NULL,
  PRIMARY KEY (`id_gestion_destino`),
  UNIQUE KEY `uq_gestion_destino_codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

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

INSERT INTO `gestion_paciente` VALUES (1,'p-001','María González López',34,'32.456.789','099 123 456');
INSERT INTO `gestion_paciente` VALUES (2,'p-002','Juan Pérez Ramírez',58,'14.987.321','098 542 166');
INSERT INTO `gestion_paciente` VALUES (3,'p-003','Lucía Fernández Díaz',29,'42.123.456','097 321 550');
INSERT INTO `gestion_paciente` VALUES (4,'p-004','Roberto Sánchez Torres',67,'10.456.987','091 348 760');
INSERT INTO `gestion_paciente` VALUES (5,'p-005','Ana Belén Rojas',41,'28.765.432','099 418 300');
INSERT INTO `gestion_paciente` VALUES (6,'p-006','Diego Martín Suárez',52,'21.638.475','095 230 160');
INSERT INTO `gestion_paciente` VALUES (7,'p-007','Camila Rodríguez Vega',24,'45.789.120','092 508 144');
INSERT INTO `gestion_paciente` VALUES (8,'p-008','Elena Morales Castro',73,'8.502.341','098 120 341');
INSERT INTO `gestion_paciente` VALUES (9,'p-009','Federico Álvarez Medina',39,'33.184.760','096 230 711');
INSERT INTO `gestion_paciente` VALUES (10,'p-010','Valeria Acosta Benítez',46,'26.552.943','097 752 630');
INSERT INTO `gestion_medico` VALUES (1,'d-001','Dr. Carlos Méndez','Clínica Médica','099 123 456','Activo');
INSERT INTO `gestion_medico` VALUES (2,'d-002','Dra. Ana Torres','Cardiología','098 542 166','Activo');
INSERT INTO `gestion_medico` VALUES (3,'d-003','Dr. Miguel Silva','Traumatología','097 321 550','Activo');
INSERT INTO `gestion_medico` VALUES (4,'d-004','Dra. Laura Martínez','Emergencias','091 348 760','Activo');
INSERT INTO `gestion_medico` VALUES (5,'d-005','Dr. Fernando Ruiz','Endocrinología','099 418 300','Inactivo');
INSERT INTO `gestion_medico` VALUES (6,'d-006','Dra. Valentina Costa','Cirugía General','095 230 160','Activo');
INSERT INTO `gestion_medico` VALUES (7,'d-007','Dra. Emilia Núñez','Dermatología','092 508 144','Activo');
INSERT INTO `gestion_medico` VALUES (8,'d-008','Dr. Andrés Pereira','Emergencias','098 120 341','Activo');
INSERT INTO `gestion_medico` VALUES (9,'d-009','Dr. Javier Soto','Neurología','096 230 711','Activo');
INSERT INTO `gestion_medico` VALUES (10,'d-010','Dra. Inés Cabrera','Medicina General','097 752 630','Activo');
INSERT INTO `gestion_medico` VALUES (11,'d-011','Dr. Pablo Acosta','Cardiología','099 640 218','Activo');
INSERT INTO `gestion_medico` VALUES (12,'d-012','Dra. Sofía Rodríguez','Clínica Médica','098 325 741','Inactivo');
INSERT INTO `gestion_personal` VALUES (2,'seed-2','Miguel Torres','Chofer','098 765 432','','Activo');
INSERT INTO `gestion_personal` VALUES (3,'seed-3','José Ramírez','Chofer','099 234 567','','Activo');
INSERT INTO `gestion_personal` VALUES (4,'seed-4','Fernando López','Chofer','098 345 678','','Inactivo');
INSERT INTO `gestion_personal` VALUES (5,'seed-5','Ricardo Sosa','Chofer','099 876 543','','Activo');
INSERT INTO `gestion_personal` VALUES (6,'seed-6','Daniel Giménez','Chofer','098 111 222','','Activo');
INSERT INTO `gestion_personal` VALUES (12,'seed-1','Carlos Fernández','Chofer','099 123 456','','Activo');
INSERT INTO `gestion_personal` VALUES (20,'seed-20','Ana Gómez','Acompañante','099 456 789','','Activo');
INSERT INTO `gestion_personal` VALUES (21,'seed-21','Martín Silva','Acompañante','098 222 333','','Activo');
INSERT INTO `gestion_personal` VALUES (22,'seed-22','Lucía Pereira','Acompañante','097 111 444','','Activo');
INSERT INTO `gestion_destino` VALUES (1,'seed-1','Hospital de Clínicas','Av. Italia 2870','Montevideo','Activo',-34.893000,-56.153000);
INSERT INTO `gestion_destino` VALUES (2,'seed-2','Hospital Maciel','25 de Mayo 174','Montevideo','Activo',-34.906700,-56.208500);
INSERT INTO `gestion_destino` VALUES (3,'seed-3','Hospital Pasteur','Larravide 2458','Montevideo','Activo',-34.871700,-56.141600);
INSERT INTO `gestion_destino` VALUES (4,'seed-4','Sanatorio Central','Av. 18 de Julio 1820','Montevideo','Activo',-34.900500,-56.174500);
INSERT INTO `gestion_destino` VALUES (5,'seed-5','Centro de Rehabilitación','Camino Maldonado 5680','Montevideo','Activo',-34.855000,-56.100000);
INSERT INTO `gestion_destino` VALUES (6,'seed-6','Policlínica Las Piedras','Av. Artigas 560','Las Piedras','Activo',-34.727000,-56.219000);
INSERT INTO `gestion_destino` VALUES (7,'seed-7','Centro de Diagnóstico','Bv. Artigas 1450','Montevideo','Activo',-34.893500,-56.164000);
INSERT INTO `gestion_destino` VALUES (8,'seed-8','Laboratorio Central','Av. Italia 2890','Montevideo','Activo',-34.892800,-56.152000);
INSERT INTO `gestion_destino` VALUES (9,'seed-9','Hospital Escuela del Litoral','Montevideo 1361','Paysandú','Activo',-32.317100,-58.080700);
INSERT INTO `gestion_destino` VALUES (10,'seed-10','Hospital Regional Salto','Av. Juan H. Paiva s/n','Salto','Activo',-31.389300,-57.961200);
INSERT INTO `gestion_destino` VALUES (11,'seed-11','Hospital Regional Tacuarembó','Treinta y Tres 444','Tacuarembó','Activo',-31.711000,-55.983000);
INSERT INTO `gestion_destino` VALUES (12,'seed-12','Hospital de Maldonado','Ventura Alegre s/n','Maldonado','Activo',-34.907000,-54.953000);
INSERT INTO `gestion_destino` VALUES (13,'seed-13','Hospital de Colonia','Av. Roosevelt s/n','Colonia','Activo',-34.470000,-57.844000);
-- Las 5 rutas predeterminadas, todas en Montevideo
-- (seed-1 Clínicas, seed-2 Maciel, seed-3 Pasteur, seed-4 Sanatorio Central, seed-5 Centro de Rehabilitación,
--  seed-7 Centro de Diagnóstico, seed-8 Laboratorio Central)
INSERT INTO `gestion_ruta`
  (`id_gestion_ruta`, `codigo`, `numero`, `nombre`, `categoria`, `sentido`, `estado`, `origen`, `destino`, `paradas`, `duracion_min`, `notas`)
VALUES
  (1, 'ruta-1', 'RT-001', 'Clínicas → Hospital Maciel', 'Interhospitalario', 'Solo ida', 'Activa', 'seed-1', 'seed-2', '[]', 25, 'Salida por el acceso de ambulancias.'),
  (2, 'ruta-2', 'RT-002', 'Circuito de rehabilitación', 'Tratamiento', 'Ida y vuelta', 'Activa', 'seed-1', 'seed-5', '["seed-7"]', 35, 'Confirmar el punto de encuentro antes de salir.'),
  (3, 'ruta-3', 'RT-003', 'Clínicas → Hospital Pasteur', 'Interhospitalario', 'Solo ida', 'Activa', 'seed-1', 'seed-3', '[]', 18, NULL),
  (4, 'ruta-4', 'RT-004', 'Consulta · Sanatorio Central', 'Consulta', 'Ida y vuelta', 'Activa', 'seed-1', 'seed-4', '[]', 15, 'Coordinar el regreso al terminar la consulta.'),
  (7, 'ruta-7', 'RT-005', 'Muestras al Laboratorio Central', 'Tratamiento', 'Solo ida', 'Activa', 'seed-1', 'seed-8', '[]', 5, 'Laboratorio temporalmente cerrado.');

-- =========================================================
-- CALENDARIO: TURNOS DE PACIENTES
-- =========================================================

CREATE TABLE `turno` (
  `id_turno` int(11) NOT NULL AUTO_INCREMENT,
  `id_gestion_paciente` int(11) NOT NULL,
  `id_gestion_medico` int(11) DEFAULT NULL,
  `fecha` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `motivo` varchar(200) NOT NULL,
  `estado` varchar(20) NOT NULL DEFAULT 'PROGRAMADO' COMMENT 'PROGRAMADO, ATENDIDO o CANCELADO',
  `notas` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id_turno`),
  KEY `idx_turno_fecha` (`fecha`),
  KEY `idx_turno_paciente` (`id_gestion_paciente`),
  KEY `idx_turno_medico` (`id_gestion_medico`),
  CONSTRAINT `fk_turno_paciente`
    FOREIGN KEY (`id_gestion_paciente`) REFERENCES `gestion_paciente` (`id_gestion_paciente`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_turno_medico`
    FOREIGN KEY (`id_gestion_medico`) REFERENCES `gestion_medico` (`id_gestion_medico`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

-- Turnos de ejemplo (semana del 12 al 18 de octubre de 2026 y la siguiente)
INSERT INTO `turno`
  (`id_turno`, `id_gestion_paciente`, `id_gestion_medico`, `fecha`, `hora_inicio`, `hora_fin`, `motivo`, `estado`, `notas`)
VALUES
  (1, 2, 2, '2026-10-12', '09:00:00', '09:30:00', 'Control cardiológico', 'ATENDIDO', NULL),
  (2, 5, 1, '2026-10-12', '10:00:00', '10:30:00', 'Control endocrinológico', 'ATENDIDO', NULL),
  (3, 7, 7, '2026-10-13', '14:00:00', '14:30:00', 'Consulta dermatológica', 'ATENDIDO', NULL),
  (4, 10, 10, '2026-10-14', '15:00:00', '15:30:00', 'Control general', 'CANCELADO', 'El paciente avisó que no puede venir.'),
  (5, 2, 2, '2026-10-15', '08:30:00', '09:00:00', 'Electrocardiograma', 'PROGRAMADO', 'Venir en ayunas.'),
  (6, 9, 9, '2026-10-15', '11:00:00', '12:00:00', 'Evaluación neurológica', 'PROGRAMADO', NULL),
  (7, 3, 3, '2026-10-15', '16:00:00', '16:30:00', 'Control de fractura', 'PROGRAMADO', 'Traer radiografías.'),
  (8, 5, 1, '2026-10-16', '09:00:00', '09:30:00', 'Resultados de laboratorio', 'PROGRAMADO', NULL),
  (9, 7, 7, '2026-10-16', '13:30:00', '14:00:00', 'Control dermatológico', 'PROGRAMADO', NULL),
  (10, 10, 10, '2026-10-19', '14:30:00', '15:00:00', 'Control general', 'PROGRAMADO', 'Reprogramado del 14/10.'),
  (11, 6, 6, '2026-10-20', '08:00:00', '09:00:00', 'Control posoperatorio', 'PROGRAMADO', NULL),
  (12, 1, 1, '2026-10-21', '10:30:00', '11:00:00', 'Control de neumonía', 'PROGRAMADO', NULL);

-- =========================================================
-- TRASLADOS DE AMBULANCIAS
-- Usa las ambulancias, el personal, los destinos y los pacientes de Gestión.
-- Lo que lleva cada traslado se guarda en carga_transportada.
-- =========================================================

CREATE TABLE `gestion_traslado` (
  `id_gestion_traslado` int(11) NOT NULL AUTO_INCREMENT,
  `id_ambulancia` int(11) NOT NULL,
  `id_chofer` int(11) NOT NULL COMMENT 'gestion_personal (conductor)',
  `id_acompanante` int(11) DEFAULT NULL COMMENT 'gestion_personal (copiloto o acompañante)',
  `id_gestion_paciente` int(11) DEFAULT NULL COMMENT 'paciente trasladado (si lo que lleva es un paciente)',
  `id_origen` int(11) NOT NULL COMMENT 'gestion_destino',
  `id_destino` int(11) DEFAULT NULL COMMENT 'gestion_destino (vacío si se escribió una dirección)',
  `destino_direccion` varchar(200) DEFAULT NULL COMMENT 'dirección escrita a mano, ej. una casa',
  `destino_lat` decimal(9,6) DEFAULT NULL COMMENT 'ubicación de destino_direccion en el mapa',
  `destino_lng` decimal(9,6) DEFAULT NULL,
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
  (`id_gestion_traslado`, `id_ambulancia`, `id_chofer`, `id_acompanante`, `id_gestion_paciente`, `id_origen`, `id_destino`,
   `salida_programada`, `llegada_estimada`, `salida_real`, `llegada_real`, `retorno_real`, `estado`, `notas`)
VALUES
  (1, 1, 2, 20, 4, 1, 9, '2026-10-16 08:00:00', '2026-10-16 12:30:00', '2026-10-16 08:05:00', NULL, NULL, 'EN_CAMINO', 'Control en el Hospital Escuela del Litoral.'),
  (2, 2, 5, NULL, NULL, 1, 7, '2026-10-16 15:00:00', '2026-10-16 15:20:00', NULL, NULL, NULL, 'PROGRAMADO', NULL),
  (3, 4, 6, 21, 2, 1, 3, '2026-10-16 10:00:00', '2026-10-16 10:20:00', '2026-10-16 10:02:00', '2026-10-16 10:21:00', NULL, 'EN_DESTINO', NULL),
  (4, 8, 12, 21, 5, 1, 10, '2026-10-15 06:00:00', '2026-10-15 12:00:00', '2026-10-15 06:10:00', '2026-10-15 12:05:00', NULL, 'RETORNANDO', NULL),
  (5, 6, 3, 22, 7, 1, 12, '2026-10-15 09:00:00', '2026-10-15 10:45:00', '2026-10-15 09:00:00', '2026-10-15 10:50:00', '2026-10-15 13:10:00', 'FINALIZADO', NULL),
  (6, 2, 5, NULL, NULL, 1, 2, '2026-10-14 10:00:00', '2026-10-14 10:30:00', '2026-10-14 10:00:00', '2026-10-14 10:35:00', '2026-10-14 11:20:00', 'FINALIZADO', NULL),
  (7, 4, 6, NULL, 10, 1, 4, '2026-10-14 15:00:00', '2026-10-14 15:15:00', NULL, NULL, NULL, 'CANCELADO', 'El paciente reprogramó.');

-- Qué lleva cada traslado: un paciente, un elemento biológico (muestras, sangre...) u otra cosa
CREATE TABLE `carga_transportada` (
  `id_carga` int(11) NOT NULL AUTO_INCREMENT,
  `id_gestion_traslado` int(11) NOT NULL,
  `tipo` varchar(30) NOT NULL COMMENT 'Paciente, Elemento biológico u Otro',
  `descripcion` varchar(150) DEFAULT NULL COMMENT 'qué se lleva (si no es un paciente)',
  PRIMARY KEY (`id_carga`),
  UNIQUE KEY `uq_carga_traslado` (`id_gestion_traslado`),
  CONSTRAINT `fk_carga_traslado` FOREIGN KEY (`id_gestion_traslado`) REFERENCES `gestion_traslado` (`id_gestion_traslado`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

INSERT INTO `carga_transportada` (`id_gestion_traslado`, `tipo`, `descripcion`) VALUES
  (1, 'Paciente', NULL),
  (2, 'Elemento biológico', 'Muestras de laboratorio'),
  (3, 'Paciente', NULL),
  (4, 'Paciente', NULL),
  (5, 'Paciente', NULL),
  (6, 'Otro', 'Ecógrafo portátil'),
  (7, 'Paciente', NULL);

-- =========================================================
-- VALORES AUTO_INCREMENT
-- =========================================================

ALTER TABLE `persona` AUTO_INCREMENT = 5;
ALTER TABLE `ambulancia` AUTO_INCREMENT = 9;
ALTER TABLE `gestion_paciente` AUTO_INCREMENT = 11;
ALTER TABLE `gestion_medico` AUTO_INCREMENT = 13;
ALTER TABLE `gestion_personal` AUTO_INCREMENT = 23;
ALTER TABLE `gestion_destino` AUTO_INCREMENT = 14;
ALTER TABLE `gestion_ruta` AUTO_INCREMENT = 8;
ALTER TABLE `turno` AUTO_INCREMENT = 13;
ALTER TABLE `gestion_traslado` AUTO_INCREMENT = 8;
ALTER TABLE `carga_transportada` AUTO_INCREMENT = 8;
ALTER TABLE `tipo_documento` AUTO_INCREMENT = 4;
ALTER TABLE `documento` AUTO_INCREMENT = 1;
ALTER TABLE `servicio_hospitalario` AUTO_INCREMENT = 5;
ALTER TABLE `encuesta` AUTO_INCREMENT = 3;
ALTER TABLE `envio_encuesta` AUTO_INCREMENT = 4;
ALTER TABLE `pregunta` AUTO_INCREMENT = 6;
ALTER TABLE `respuesta` AUTO_INCREMENT = 6;
ALTER TABLE `usuario` AUTO_INCREMENT = 4;
ALTER TABLE `configuracion_usuario` AUTO_INCREMENT = 4;

SET FOREIGN_KEY_CHECKS = 1;

COMMIT;
