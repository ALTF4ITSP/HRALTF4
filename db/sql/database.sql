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
  `legajo` varchar(20) NOT NULL,
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
  (3, 'SAB003', 'Fiat Ducato', 3, 'MANTENIMIENTO');

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
  (3, 'Documento Administrativo', 'Documentación administrativa de pacientes/hospital'),
  (5, 'Resultado de estudio', 'Tipo de documento utilizado por el sistema.');

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

INSERT INTO `documento`
  (`id_documento`, `id_tipo_documento`, `titulo`, `descripcion`, `ruta_archivo`, `fecha_carga`, `version`, `estado`, `id_funcionario_carga`)
VALUES
  (3, 1, 'Informe Médico de Paciente (prueba 1)', 'Prueba Nro1', 'uploads/documentos/doc_6aa174f97b6844.99393758.pdf', '2026-09-09 12:02:17', 1, 'ACTIVO', 3),
  (4, 3, 'Documento administrativo de hospital (prueba 2)', 'Prueba Nro2', 'uploads/documentos/doc_6aa1754a648e36.38804847.pdf', '2026-09-09 12:03:38', 1, 'ACTIVO', 3),
  (5, 5, 'PRUEBA DEL 10/09', 'PRUEBA 3 DEL 10/09', 'uploads/documentos/doc_6aa29f8f7fe291.77249241.pdf', '2026-09-10 09:16:15', 1, 'ACTIVO', 3);

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
-- VALORES AUTO_INCREMENT
-- =========================================================

ALTER TABLE `persona` AUTO_INCREMENT = 5;
ALTER TABLE `ambulancia` AUTO_INCREMENT = 4;
ALTER TABLE `ruta` AUTO_INCREMENT = 4;
ALTER TABLE `solicitud_traslado` AUTO_INCREMENT = 3;
ALTER TABLE `carga_transportada` AUTO_INCREMENT = 4;
ALTER TABLE `traslado` AUTO_INCREMENT = 3;
ALTER TABLE `historial_estado` AUTO_INCREMENT = 4;
ALTER TABLE `tipo_documento` AUTO_INCREMENT = 6;
ALTER TABLE `documento` AUTO_INCREMENT = 6;
ALTER TABLE `servicio_hospitalario` AUTO_INCREMENT = 5;
ALTER TABLE `encuesta` AUTO_INCREMENT = 3;
ALTER TABLE `envio_encuesta` AUTO_INCREMENT = 4;
ALTER TABLE `pregunta` AUTO_INCREMENT = 6;
ALTER TABLE `respuesta` AUTO_INCREMENT = 6;
ALTER TABLE `usuario` AUTO_INCREMENT = 4;
ALTER TABLE `configuracion_usuario` AUTO_INCREMENT = 4;

SET FOREIGN_KEY_CHECKS = 1;

COMMIT;
