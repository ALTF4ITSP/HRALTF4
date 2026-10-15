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

CREATE TABLE `paciente` (
  `id_persona` int(11) NOT NULL,
  `nro_historia` varchar(20) NOT NULL,
  PRIMARY KEY (`id_persona`),
  UNIQUE KEY `uq_paciente_historia` (`nro_historia`),
  CONSTRAINT `fk_paciente_persona`
    FOREIGN KEY (`id_persona`) REFERENCES `persona` (`id_persona`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

INSERT INTO `paciente` (`id_persona`, `nro_historia`) VALUES
  (2, 'HC001'),
  (3, 'HC002');

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

CREATE TABLE `ruta` (
  `id_ruta` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `origen` varchar(150) NOT NULL,
  `destino` varchar(150) NOT NULL,
  `distancia_km` decimal(8,2) NOT NULL,
  `estado` varchar(30) NOT NULL,
  PRIMARY KEY (`id_ruta`),
  UNIQUE KEY `uq_ruta_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

INSERT INTO `ruta`
  (`id_ruta`, `nombre`, `origen`, `destino`, `distancia_km`, `estado`)
VALUES
  (1, 'Ruta Paysandu - Montevideo', 'Hospital de Clínicas', 'Montevideo', 380.50, 'ACTIVA'),
  (2, 'Ruta Paysandu - Salto', 'Hospital de Clínicas', 'Salto', 120.00, 'ACTIVA'),
  (3, 'Ruta Paysandu - Colonia', 'Hospital de Clínicas', 'Colonia del Sacramento', 450.00, 'ACTIVA');

CREATE TABLE `solicitud_traslado` (
  `id_solicitud` int(11) NOT NULL AUTO_INCREMENT,
  `fecha_solicitud` datetime NOT NULL,
  `salida_programada` datetime NOT NULL,
  `llegada_estimada` datetime NOT NULL,
  `prioridad` varchar(30) NOT NULL,
  `estado_solicitud` varchar(30) NOT NULL,
  `observaciones` varchar(500) DEFAULT NULL,
  `id_funcionario_registra` int(11) NOT NULL,
  `id_conductor` int(11) NOT NULL,
  `id_acompanante` int(11) NOT NULL,
  `id_ruta` int(11) NOT NULL,
  `id_ambulancia` int(11) NOT NULL,
  `id_paciente` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_solicitud`),
  KEY `idx_solicitud_registra` (`id_funcionario_registra`),
  KEY `idx_solicitud_conductor` (`id_conductor`),
  KEY `idx_solicitud_acompanante` (`id_acompanante`),
  KEY `idx_solicitud_ruta` (`id_ruta`),
  KEY `idx_solicitud_ambulancia` (`id_ambulancia`),
  KEY `idx_solicitud_paciente` (`id_paciente`),
  CONSTRAINT `fk_solicitud_registra`
    FOREIGN KEY (`id_funcionario_registra`) REFERENCES `funcionario` (`id_persona`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_solicitud_conductor`
    FOREIGN KEY (`id_conductor`) REFERENCES `funcionario` (`id_persona`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_solicitud_acompanante`
    FOREIGN KEY (`id_acompanante`) REFERENCES `persona` (`id_persona`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_solicitud_ruta`
    FOREIGN KEY (`id_ruta`) REFERENCES `ruta` (`id_ruta`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_solicitud_ambulancia`
    FOREIGN KEY (`id_ambulancia`) REFERENCES `ambulancia` (`id_ambulancia`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_solicitud_paciente`
    FOREIGN KEY (`id_paciente`) REFERENCES `paciente` (`id_persona`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

INSERT INTO `solicitud_traslado`
  (`id_solicitud`, `fecha_solicitud`, `salida_programada`, `llegada_estimada`, `prioridad`, `estado_solicitud`, `observaciones`, `id_funcionario_registra`, `id_conductor`, `id_acompanante`, `id_ruta`, `id_ambulancia`, `id_paciente`)
VALUES
  (1, '2026-09-04 08:00:00', '2026-09-04 10:00:00', '2026-09-04 14:00:00', 'ALTA', 'PENDIENTE', 'Traslado de paciente para consulta especializada', 3, 1, 2, 1, 1, 2),
  (2, '2026-09-04 08:30:00', '2026-09-05 09:00:00', '2026-09-05 12:00:00', 'MEDIA', 'PENDIENTE', 'Traslado programado', 3, 1, 2, 2, 2, NULL);

CREATE TABLE `carga_transportada` (
  `id_carga` int(11) NOT NULL AUTO_INCREMENT,
  `tipo` varchar(50) NOT NULL,
  `descripcion` varchar(200) DEFAULT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `unidad` varchar(30) NOT NULL,
  `condiciones_especiales` varchar(300) DEFAULT NULL,
  `id_solicitud` int(11) NOT NULL,
  PRIMARY KEY (`id_carga`),
  KEY `idx_carga_solicitud` (`id_solicitud`),
  CONSTRAINT `fk_carga_solicitud`
    FOREIGN KEY (`id_solicitud`) REFERENCES `solicitud_traslado` (`id_solicitud`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

INSERT INTO `carga_transportada`
  (`id_carga`, `tipo`, `descripcion`, `cantidad`, `unidad`, `condiciones_especiales`, `id_solicitud`)
VALUES
  (1, 'Medicamento', 'Medicación de emergencia', 10.00, 'unidades', 'Conservar en lugar fresco', 1),
  (2, 'Equipamiento', 'Kit de primeros auxilios', 2.00, 'unidades', 'Mantener cerrado', 1),
  (3, 'Insumo', 'Suero fisiológico', 5.00, 'litros', 'Evitar exposición al calor', 2);

CREATE TABLE `traslado` (
  `id_traslado` int(11) NOT NULL AUTO_INCREMENT,
  `salida_real` datetime DEFAULT NULL,
  `llegada_real` datetime DEFAULT NULL,
  `inicio_retorno_real` datetime DEFAULT NULL,
  `retorno_real` datetime DEFAULT NULL,
  `observaciones` varchar(500) DEFAULT NULL,
  `id_solicitud` int(11) NOT NULL,
  `id_supervisor` int(11) NOT NULL,
  PRIMARY KEY (`id_traslado`),
  UNIQUE KEY `uq_traslado_solicitud` (`id_solicitud`),
  KEY `idx_traslado_supervisor` (`id_supervisor`),
  CONSTRAINT `fk_traslado_solicitud`
    FOREIGN KEY (`id_solicitud`) REFERENCES `solicitud_traslado` (`id_solicitud`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_traslado_supervisor`
    FOREIGN KEY (`id_supervisor`) REFERENCES `funcionario` (`id_persona`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

INSERT INTO `traslado`
  (`id_traslado`, `salida_real`, `llegada_real`, `inicio_retorno_real`, `retorno_real`, `observaciones`, `id_solicitud`, `id_supervisor`)
VALUES
  (1, '2026-09-04 10:05:00', '2026-09-04 13:50:00', '2026-09-04 14:10:00', '2026-09-04 17:30:00', 'Traslado realizado correctamente', 1, 3),
  (2, NULL, NULL, NULL, NULL, 'Traslado programado; aún no iniciado', 2, 3);

CREATE TABLE `historial_estado` (
  `id_historial` int(11) NOT NULL AUTO_INCREMENT,
  `estado` varchar(30) NOT NULL,
  `fecha_hora` datetime NOT NULL,
  `ubicacion` varchar(200) DEFAULT NULL,
  `observaciones` varchar(500) DEFAULT NULL,
  `id_traslado` int(11) NOT NULL,
  `id_funcionario_registra` int(11) NOT NULL,
  PRIMARY KEY (`id_historial`),
  KEY `idx_historial_traslado` (`id_traslado`),
  KEY `idx_historial_funcionario` (`id_funcionario_registra`),
  CONSTRAINT `fk_historial_traslado`
    FOREIGN KEY (`id_traslado`) REFERENCES `traslado` (`id_traslado`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_historial_funcionario`
    FOREIGN KEY (`id_funcionario_registra`) REFERENCES `funcionario` (`id_persona`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

INSERT INTO `historial_estado`
  (`id_historial`, `estado`, `fecha_hora`, `ubicacion`, `observaciones`, `id_traslado`, `id_funcionario_registra`)
VALUES
  (1, 'PROGRAMADO', '2026-09-04 09:00:00', 'Hospital de Clínicas', 'Traslado programado', 1, 3),
  (2, 'HACIA_DESTINO', '2026-09-04 10:05:00', 'Montevideo', 'Ambulancia en camino', 1, 3),
  (3, 'EN_DESTINO', '2026-09-04 13:50:00', 'Montevideo', 'Llegada al destino', 1, 3);

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
  `foto_publica` tinyint(1) NOT NULL DEFAULT 1,
  `analisis_rendimiento` tinyint(1) NOT NULL DEFAULT 1,
  `notificaciones_seguridad` tinyint(1) NOT NULL DEFAULT 0,
  `cierre_sesion_automatico` tinyint(1) NOT NULL DEFAULT 0,
  `idioma` varchar(20) NOT NULL DEFAULT 'Español',
  `tema` varchar(10) NOT NULL DEFAULT 'dark',
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_configuracion`),
  UNIQUE KEY `uq_configuracion_usuario` (`id_usuario`),
  CONSTRAINT `fk_configuracion_usuario`
    FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

INSERT INTO `configuracion_usuario`
  (`id_usuario`, `centro`, `foto_perfil`, `foto_publica`, `analisis_rendimiento`, `notificaciones_seguridad`, `cierre_sesion_automatico`, `idioma`, `tema`)
VALUES
  (1, 'Hospital de Clínicas', NULL, 1, 1, 0, 0, 'Español', 'dark'),
  (2, 'Hospital de Clínicas', NULL, 1, 1, 0, 0, 'Español', 'dark'),
  (3, 'Hospital de Clínicas', NULL, 1, 1, 0, 0, 'Español', 'dark');

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

CREATE TABLE `gestion_medico` (
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

CREATE TABLE `gestion_personal` (
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

CREATE TABLE `gestion_destino` (
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

CREATE TABLE `gestion_ruta` (
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

INSERT INTO `gestion_paciente` VALUES (1,'p-001','María González López',34,'32.456.789','099 123 456','Internado','Habitación 204','Medicina Interna','Dr. Carlos Méndez','Clínica Médica','15 de mar. 2024','O+','Penicilina','Neumonía leve','Estable','José González','098 765 432','Padre');
INSERT INTO `gestion_paciente` VALUES (2,'p-002','Juan Pérez Ramírez',58,'14.987.321','098 542 166','Ambulatorio','Ambulatorio','Consultorios Externos','Dra. Ana Torres','Cardiología','18 de mar. 2024','A+','Ninguna conocida','Control cardiológico','Estable','Sofía Pérez','099 812 400','Hija');
INSERT INTO `gestion_paciente` VALUES (3,'p-003','Lucía Fernández Díaz',29,'42.123.456','097 321 550','Internado','Habitación 318','Traumatología','Dr. Miguel Silva','Traumatología','16 de mar. 2024','B+','Látex','Fractura de tibia','Estable','Martín Fernández','098 500 914','Hermano');
INSERT INTO `gestion_paciente` VALUES (4,'p-004','Roberto Sánchez Torres',67,'10.456.987','091 348 760','Urgencias','Urgencias','Observación','Dra. Laura Martínez','Emergencias','18 de mar. 2024','AB+','Ninguna conocida','Dolor torácico','En observación','Elena Torres','098 765 100','Esposa');
INSERT INTO `gestion_paciente` VALUES (5,'p-005','Ana Belén Rojas',41,'28.765.432','099 418 300','Ambulatorio','Ambulatorio','Consultorios Externos','Dr. Fernando Ruiz','Endocrinología','18 de mar. 2024','O-','Ninguna conocida','Control endocrinológico','Estable','Pablo Rojas','091 348 901','Esposo');
INSERT INTO `gestion_paciente` VALUES (6,'p-006','Diego Martín Suárez',52,'21.638.475','095 230 160','Internado','Habitación 112','Cirugía General','Dra. Valentina Costa','Cirugía','17 de mar. 2024','A-','Ibuprofeno','Recuperación posoperatoria','Estable','Laura Suárez','098 240 660','Hermana');
INSERT INTO `gestion_paciente` VALUES (7,'p-007','Camila Rodríguez Vega',24,'45.789.120','092 508 144','Ambulatorio','Ambulatorio','Consultorios Externos','Dra. Emilia Núñez','Dermatología','18 de mar. 2024','B-','Ninguna conocida','Consulta dermatológica','Estable','Teresa Vega','095 434 170','Madre');
INSERT INTO `gestion_paciente` VALUES (8,'p-008','Elena Morales Castro',73,'8.502.341','098 120 341','Urgencias','Urgencias','Observación','Dr. Andrés Pereira','Emergencias','18 de mar. 2024','O+','Sulfas','Deshidratación','En observación','Daniel Castro','099 120 800','Hijo');
INSERT INTO `gestion_paciente` VALUES (9,'p-009','Federico Álvarez Medina',39,'33.184.760','096 230 711','Internado','Habitación 225','Neurología','Dr. Javier Soto','Neurología','14 de mar. 2024','A+','Ninguna conocida','Evaluación neurológica','Estable','Florencia Medina','096 330 721','Esposa');
INSERT INTO `gestion_paciente` VALUES (10,'p-010','Valeria Acosta Benítez',46,'26.552.943','097 752 630','Ambulatorio','Ambulatorio','Consultorios Externos','Dra. Inés Cabrera','Medicina General','18 de mar. 2024','AB-','Penicilina','Control general','Estable','Luis Acosta','098 660 122','Hermano');
INSERT INTO `gestion_medico` VALUES (1,'d-001','Dr.','Carlos Méndez','3.456.781-2','MSP-10482','Clínica Médica','Medicina Interna','Sala 2 · Piso 2','099 123 456','c.mendez@hospital.example','Disponible','Mañana','Lunes a viernes','08:00','14:00','Referente del equipo de Medicina Interna.');
INSERT INTO `gestion_medico` VALUES (2,'d-002','Dra.','Ana Torres','4.128.562-3','MSP-11206','Cardiología','Consultorios Externos','Consultorio 12','098 542 166','a.torres@hospital.example','En consulta','Mañana','Lunes, miércoles y viernes','08:00','13:00','Consultas de control y seguimiento cardiológico.');
INSERT INTO `gestion_medico` VALUES (3,'d-003','Dr.','Miguel Silva','3.987.124-5','MSP-09871','Traumatología','Traumatología','Sala 3 · Piso 3','097 321 550','m.silva@hospital.example','De guardia','Rotativo','Rotativo','08:00','20:00','Guardia de traumatología y valoración de pacientes internados.');
INSERT INTO `gestion_medico` VALUES (4,'d-004','Dra.','Laura Martínez','4.765.219-6','MSP-12540','Emergencias','Urgencias','Área de observación','091 348 760','l.martinez@hospital.example','De guardia','Tarde','Rotativo','14:00','22:00','Atención y coordinación del área de urgencias.');
INSERT INTO `gestion_medico` VALUES (5,'d-005','Dr.','Fernando Ruiz','2.875.643-7','MSP-08734','Endocrinología','Consultorios Externos','Consultorio 8','099 418 300','f.ruiz@hospital.example','Inactivo','Tarde','Martes y jueves','14:00','18:00','Licencia programada. Consultas sujetas a reasignación.');
INSERT INTO `gestion_medico` VALUES (6,'d-006','Dra.','Valentina Costa','4.365.824-8','MSP-13402','Cirugía General','Cirugía General','Bloque quirúrgico','095 230 160','v.costa@hospital.example','En consulta','Mañana','Lunes a viernes','07:00','13:00','Valoración preoperatoria y seguimiento posoperatorio.');
INSERT INTO `gestion_medico` VALUES (7,'d-007','Dra.','Emilia Núñez','4.921.635-9','MSP-14218','Dermatología','Consultorios Externos','Consultorio 5','092 508 144','e.nunez@hospital.example','Disponible','Tarde','Martes y jueves','13:00','19:00','');
INSERT INTO `gestion_medico` VALUES (8,'d-008','Dr.','Andrés Pereira','3.562.471-0','MSP-10635','Emergencias','Urgencias','Box 4','098 120 341','a.pereira@hospital.example','De guardia','Noche','Rotativo','22:00','06:00','Guardia nocturna de emergencias.');
INSERT INTO `gestion_medico` VALUES (9,'d-009','Dr.','Javier Soto','3.841.962-1','MSP-11783','Neurología','Neurología','Consultorio 16','096 230 711','j.soto@hospital.example','En consulta','Mañana','Lunes, miércoles y viernes','09:00','14:00','');
INSERT INTO `gestion_medico` VALUES (10,'d-010','Dra.','Inés Cabrera','4.258.716-2','MSP-12892','Medicina General','Consultorios Externos','Consultorio 2','097 752 630','i.cabrera@hospital.example','Disponible','Tarde','Lunes a viernes','14:00','20:00','Consultas de medicina general y controles preventivos.');
INSERT INTO `gestion_medico` VALUES (11,'d-011','Dr.','Pablo Acosta','3.724.159-3','MSP-10954','Cardiología','Cardiología','Sala 1 · Piso 2','099 640 218','p.acosta@hospital.example','Disponible','Mañana','Lunes a viernes','08:00','14:00','');
INSERT INTO `gestion_medico` VALUES (12,'d-012','Dra.','Sofía Rodríguez','4.638.925-4','MSP-14573','Clínica Médica','Medicina Interna','Sala 4 · Piso 2','098 325 741','s.rodriguez@hospital.example','Inactivo','Tarde','Lunes a viernes','14:00','20:00','');
INSERT INTO `gestion_personal` VALUES (2,'seed-2','Miguel Torres','Chofer','098 765 432','','B7654321','Activo');
INSERT INTO `gestion_personal` VALUES (3,'seed-3','José Ramírez','Chofer','099 234 567','','C9876543','Activo');
INSERT INTO `gestion_personal` VALUES (4,'seed-4','Fernando López','Chofer','098 345 678','','D4567890','Inactivo');
INSERT INTO `gestion_personal` VALUES (5,'seed-5','Ricardo Sosa','Chofer','099 876 543','','E3210987','Activo');
INSERT INTO `gestion_personal` VALUES (6,'seed-6','Daniel Giménez','Chofer','098 111 222','','F6543210','Activo');
INSERT INTO `gestion_personal` VALUES (12,'seed-1','Carlos Fernández','Chofer','099 123 456','','A1234567','Activo');
INSERT INTO `gestion_destino` VALUES (1,'seed-1','Hospital de Clínicas','Av. Italia 2870','Montevideo','Hospital','','Ingreso de ambulancias por emergencia.','Activo');
INSERT INTO `gestion_destino` VALUES (2,'seed-2','Hospital Maciel','25 de Mayo 174','Montevideo','Hospital','','Coordinar el acceso con el personal de recepción.','Activo');
INSERT INTO `gestion_destino` VALUES (3,'seed-3','Hospital Pasteur','Larravide 2458','Montevideo','Hospital','','','Activo');
INSERT INTO `gestion_destino` VALUES (4,'seed-4','Sanatorio Central','Av. 18 de Julio 1820','Montevideo','Sanatorio','','Acceso lateral para traslados programados.','Activo');
INSERT INTO `gestion_destino` VALUES (5,'seed-5','Centro de Rehabilitación','Camino Maldonado 5680','Montevideo','Centro de salud','','Destino temporalmente fuera de servicio.','Inactivo');
INSERT INTO `gestion_destino` VALUES (6,'seed-6','Policlínica Las Piedras','Av. Artigas 560','Las Piedras','Centro de salud','','','Activo');
INSERT INTO `gestion_destino` VALUES (7,'seed-7','Centro de Diagnóstico','Bv. Artigas 1450','Montevideo','Centro de salud','','Confirmar el horario del estudio antes del traslado.','Activo');
INSERT INTO `gestion_destino` VALUES (8,'seed-8','Laboratorio Central','Av. Italia 2890','Montevideo','Otro','','Recepción de muestras por la entrada principal.','Inactivo');
INSERT INTO `gestion_ruta` VALUES (1,'route-001','RT-001','Clínicas → Hospital Maciel','Interhospitalario','Solo ida','Activa','Hospital de Clínicas','Av. Italia 2870, Montevideo','Hospital Maciel','25 de Mayo 174, Montevideo','[]',7.8,25,'Salida por el acceso de ambulancias. Coordinar la recepción con el equipo de destino.');
INSERT INTO `gestion_ruta` VALUES (2,'route-002','RT-002','Circuito de rehabilitación','Tratamiento','Ida y vuelta','Activa','Hospital de Clínicas','Av. Italia 2870, Montevideo','Centro de rehabilitación','Av. 8 de Octubre 3250, Montevideo','[{\"name\":\"Policlínica La Unión\",\"address\":\"Larravide 2450, Montevideo\"}]',6.2,30,'Confirmar el punto de encuentro antes de la salida. Contemplar asistencia en el ascenso y descenso.');
INSERT INTO `gestion_ruta` VALUES (3,'route-003','RT-003','Clínicas → Hospital Pasteur','Interhospitalario','Solo ida','Activa','Hospital de Clínicas','Av. Italia 2870, Montevideo','Hospital Pasteur','Larravide 2458, Montevideo','[]',4.5,18,'Ingreso por el acceso de traslados. Avisar al servicio receptor al iniciar el recorrido.');
INSERT INTO `gestion_ruta` VALUES (4,'route-004','RT-004','Consulta · Ciudad Vieja','Consulta','Ida y vuelta','Activa','Hospital de Clínicas','Av. Italia 2870, Montevideo','Policlínica Ciudad Vieja','Piedras 720, Montevideo','[]',7.1,28,'Coordinar el regreso al finalizar la consulta.');
INSERT INTO `gestion_ruta` VALUES (5,'route-005','RT-005','Traslado a centro de diálisis','Tratamiento','Ida y vuelta','Activa','Hospital de Clínicas','Av. Italia 2870, Montevideo','Centro de diálisis','Bv. Artigas 1850, Montevideo','[{\"name\":\"Policlínica Cordón\",\"address\":\"Colonia 1950, Montevideo\"}]',5.3,32,'Confirmar con el centro la hora de recepción y el horario de regreso.');
INSERT INTO `gestion_ruta` VALUES (6,'route-006','RT-006','Clínicas → Hospital Español','Interhospitalario','Solo ida','Inactiva','Hospital de Clínicas','Av. Italia 2870, Montevideo','Hospital Español','Av. Garibaldi 1729, Montevideo','[]',5.6,22,'Revisar el acceso de recepción antes de reactivar la ruta.');
INSERT INTO `gestion_ruta` VALUES (7,'route-007','RT-007','Alta · Residencia Parque','Alta','Solo ida','Activa','Hospital de Clínicas','Av. Italia 2870, Montevideo','Residencia Parque','Av. Sarmiento 2450, Montevideo','[]',3.8,15,'Coordinar la entrega con el personal de la residencia.');
INSERT INTO `gestion_ruta` VALUES (8,'route-008','RT-008','Circuito de consultas externas','Consulta','Ida y vuelta','Inactiva','Hospital de Clínicas','Av. Italia 2870, Montevideo','Policlínica Norte','Av. San Martín 4250, Montevideo','[{\"name\":\"Policlínica Goes\",\"address\":\"Av. General Flores 2450, Montevideo\"},{\"name\":\"Centro de atención Reducto\",\"address\":\"Av. Millán 2850, Montevideo\"}]',9.4,45,'Verificar la disponibilidad de los centros antes de activar el circuito.');

-- =========================================================
-- VALORES AUTO_INCREMENT
-- =========================================================

ALTER TABLE `persona` AUTO_INCREMENT = 5;
ALTER TABLE `ambulancia` AUTO_INCREMENT = 9;
ALTER TABLE `gestion_paciente` AUTO_INCREMENT = 11;
ALTER TABLE `gestion_medico` AUTO_INCREMENT = 13;
ALTER TABLE `gestion_personal` AUTO_INCREMENT = 8;
ALTER TABLE `gestion_destino` AUTO_INCREMENT = 9;
ALTER TABLE `gestion_ruta` AUTO_INCREMENT = 9;
ALTER TABLE `ruta` AUTO_INCREMENT = 4;
ALTER TABLE `solicitud_traslado` AUTO_INCREMENT = 3;
ALTER TABLE `carga_transportada` AUTO_INCREMENT = 4;
ALTER TABLE `traslado` AUTO_INCREMENT = 3;
ALTER TABLE `historial_estado` AUTO_INCREMENT = 4;
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
