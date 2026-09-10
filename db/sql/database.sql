-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost
-- Tiempo de generación: 10-09-2026 a las 14:23:59
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `altf4`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ambulancia`
--

CREATE TABLE `ambulancia` (
  `id_ambulancia` int(11) NOT NULL,
  `matricula` varchar(20) NOT NULL,
  `modelo` varchar(100) NOT NULL,
  `capacidad` int(11) NOT NULL,
  `estado_operativo` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

--
-- Volcado de datos para la tabla `ambulancia`
--

INSERT INTO `ambulancia` (`id_ambulancia`, `matricula`, `modelo`, `capacidad`, `estado_operativo`) VALUES
(1, 'SAB001', 'Mercedes-Benz Sprinter', 4, 'OPERATIVA'),
(2, 'SAB002', 'Renault Master', 4, 'OPERATIVA'),
(3, 'SAB003', 'Fiat Ducato', 3, 'MANTENIMIENTO');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `carga_transportada`
--

CREATE TABLE `carga_transportada` (
  `id_carga` int(11) NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `descripcion` varchar(200) DEFAULT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `unidad` varchar(30) NOT NULL,
  `condiciones_especiales` varchar(300) DEFAULT NULL,
  `id_solicitud` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

--
-- Volcado de datos para la tabla `carga_transportada`
--

INSERT INTO `carga_transportada` (`id_carga`, `tipo`, `descripcion`, `cantidad`, `unidad`, `condiciones_especiales`, `id_solicitud`) VALUES
(1, 'Medicamento', 'Medicacion de emergencia', 10.00, 'unidades', 'Conservar en lugar fresco', 1),
(2, 'Equipamiento', 'Kit de primeros auxilios', 2.00, 'unidades', 'Mantener cerrado', 1),
(3, 'Insumo', 'Suero fisiologico', 5.00, 'litros', 'Evitar exposicion al calor', 2);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `documento`
--

CREATE TABLE `documento` (
  `id_documento` int(11) NOT NULL,
  `id_tipo_documento` int(11) NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `descripcion` varchar(500) DEFAULT NULL,
  `ruta_archivo` varchar(500) NOT NULL,
  `fecha_carga` datetime NOT NULL,
  `version` int(11) NOT NULL DEFAULT 1,
  `estado` varchar(30) NOT NULL,
  `id_funcionario_carga` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

--
-- Volcado de datos para la tabla `documento`
--

INSERT INTO `documento` (`id_documento`, `id_tipo_documento`, `titulo`, `descripcion`, `ruta_archivo`, `fecha_carga`, `version`, `estado`, `id_funcionario_carga`) VALUES
(3, 1, 'Informe Mèdico de Paciente (prueba 1)', 'Prueba Nro1', 'uploads/documentos/doc_6aa174f97b6844.99393758.pdf', '2026-09-09 12:02:17', 1, 'ACTIVO', 3),
(4, 3, 'Documento administrativo de hospital (prueba 2)', 'Prueba Nro2', 'uploads/documentos/doc_6aa1754a648e36.38804847.pdf', '2026-09-09 12:03:38', 1, 'ACTIVO', 3),
(5, 5, 'PRUEBA DEL 10/09', 'PRUEBA 3 DEL 10/09', 'uploads/documentos/doc_6aa29f8f7fe291.77249241.pdf', '2026-09-10 09:16:15', 1, 'ACTIVO', 3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `encuesta`
--

CREATE TABLE `encuesta` (
  `id_encuesta` int(11) NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `descripcion` varchar(500) DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL,
  `estado` varchar(30) NOT NULL,
  `id_servicio` int(11) NOT NULL,
  `id_funcionario_crea` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

--
-- Volcado de datos para la tabla `encuesta`
--

INSERT INTO `encuesta` (`id_encuesta`, `titulo`, `descripcion`, `fecha_creacion`, `estado`, `id_servicio`, `id_funcionario_crea`) VALUES
(1, 'Encuesta de satisfaccion', 'Evaluacion de la satisfaccion de los usuarios del hospital', '2026-09-08 10:07:32', 'ACTIVA', 1, 3),
(2, 'Evaluacion del servicio', 'Encuesta sobre la calidad de los servicios hospitalarios', '2026-09-08 10:07:32', 'ACTIVA', 2, 3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `envio_encuesta`
--

CREATE TABLE `envio_encuesta` (
  `id_envio` int(11) NOT NULL,
  `id_encuesta` int(11) NOT NULL,
  `id_persona` int(11) DEFAULT NULL,
  `fecha_hora` datetime NOT NULL,
  `completada` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

--
-- Volcado de datos para la tabla `envio_encuesta`
--

INSERT INTO `envio_encuesta` (`id_envio`, `id_encuesta`, `id_persona`, `fecha_hora`, `completada`) VALUES
(1, 1, 2, '2026-09-08 10:08:48', 1),
(2, 1, NULL, '2026-09-08 10:08:48', 0),
(3, 2, 3, '2026-09-08 10:08:48', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `funcionario`
--

CREATE TABLE `funcionario` (
  `id_persona` int(11) NOT NULL,
  `legajo` varchar(20) NOT NULL,
  `cargo` varchar(100) NOT NULL,
  `sector` varchar(100) NOT NULL,
  `licencia_conducir` varchar(30) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

--
-- Volcado de datos para la tabla `funcionario`
--

INSERT INTO `funcionario` (`id_persona`, `legajo`, `cargo`, `sector`, `licencia_conducir`, `activo`) VALUES
(1, 'LEG001', 'Chofer', 'Traslados', 'CAT-C', 1),
(2, 'LEG002', 'Enfermero', 'Emergencia', NULL, 1),
(3, 'LEG003', 'Administrativo', 'Documentación', NULL, 1),
(4, 'PRUEBA001', 'Administrativo', 'Documentacion', NULL, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `historial_estado`
--

CREATE TABLE `historial_estado` (
  `id_historial` int(11) NOT NULL,
  `estado` varchar(30) NOT NULL,
  `fecha_hora` datetime NOT NULL,
  `ubicacion` varchar(200) DEFAULT NULL,
  `observaciones` varchar(500) DEFAULT NULL,
  `id_traslado` int(11) NOT NULL,
  `id_funcionario_registra` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

--
-- Volcado de datos para la tabla `historial_estado`
--

INSERT INTO `historial_estado` (`id_historial`, `estado`, `fecha_hora`, `ubicacion`, `observaciones`, `id_traslado`, `id_funcionario_registra`) VALUES
(1, 'PROGRAMADO', '2026-09-04 09:00:00', 'Hospital de Clinicas', 'Traslado programado', 1, 3),
(2, 'HACIA_DESTINO', '2026-09-04 10:05:00', 'Montevideo', 'Ambulancia en camino', 1, 3),
(3, 'EN_DESTINO', '2026-09-04 13:50:00', 'Montevideo', 'Llegada al destino', 1, 3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `paciente`
--

CREATE TABLE `paciente` (
  `id_persona` int(11) NOT NULL,
  `nro_historia` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

--
-- Volcado de datos para la tabla `paciente`
--

INSERT INTO `paciente` (`id_persona`, `nro_historia`) VALUES
(2, 'HC001'),
(3, 'HC002');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `persona`
--

CREATE TABLE `persona` (
  `id_persona` int(11) NOT NULL,
  `cedula` varchar(20) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `fecha_nacimiento` date NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `direccion` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

--
-- Volcado de datos para la tabla `persona`
--

INSERT INTO `persona` (`id_persona`, `cedula`, `nombre`, `apellido`, `fecha_nacimiento`, `email`, `telefono`, `direccion`) VALUES
(1, '45678901', 'Ana', 'Gomez', '1985-04-12', 'ana.gomez@hospital.com', '099123456', 'Av. Italia 123'),
(2, '46789012', 'Carlos', 'Rodriguez', '1990-08-25', 'carlos.rodriguez@hospital.com', '098234567', 'Calle Rivera 456'),
(3, '47890123', 'Lucia', 'Fernandez', '1988-11-03', 'lucia.fernandez@hospital.com', '097345678', 'Calle Artigas 789'),
(4, '57606837', 'Emilia', 'Muniz', '2008-10-17', 'emiliamuniz1710@gmail.com', '099686880', 'Paysandù');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pregunta`
--

CREATE TABLE `pregunta` (
  `id_pregunta` int(11) NOT NULL,
  `id_encuesta` int(11) NOT NULL,
  `enunciado` varchar(500) NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `orden` int(11) NOT NULL,
  `obligatoria` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

--
-- Volcado de datos para la tabla `pregunta`
--

INSERT INTO `pregunta` (`id_pregunta`, `id_encuesta`, `enunciado`, `tipo`, `orden`, `obligatoria`) VALUES
(1, 1, '¿Qué tan satisfecho está con la atención recibida?', 'ESCALA', 1, 1),
(2, 1, '¿Cómo calificaría la atención del personal?', 'ESCALA', 2, 1),
(3, 1, '¿Tiene alguna sugerencia para mejorar el servicio?', 'TEXTO', 3, 0),
(4, 2, '¿Cómo evaluaría la calidad del servicio?', 'ESCALA', 1, 1),
(5, 2, '¿Recomendaría este servicio?', 'SI_NO', 2, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `qr`
--

CREATE TABLE `qr` (
  `id_qr` int(11) NOT NULL,
  `id_documento` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `fecha_generacion` datetime NOT NULL,
  `fecha_expiracion` datetime DEFAULT NULL,
  `estado` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `respuesta`
--

CREATE TABLE `respuesta` (
  `id_respuesta` int(11) NOT NULL,
  `id_envio` int(11) NOT NULL,
  `id_pregunta` int(11) NOT NULL,
  `respuesta_texto` varchar(1000) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

--
-- Volcado de datos para la tabla `respuesta`
--

INSERT INTO `respuesta` (`id_respuesta`, `id_envio`, `id_pregunta`, `respuesta_texto`) VALUES
(1, 1, 1, 'Muy satisfecho'),
(2, 1, 2, 'Excelente'),
(3, 1, 3, 'Todo estuvo muy bien'),
(4, 3, 4, 'Muy bueno'),
(5, 3, 5, 'Sí');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ruta`
--

CREATE TABLE `ruta` (
  `id_ruta` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `origen` varchar(150) NOT NULL,
  `destino` varchar(150) NOT NULL,
  `distancia_km` decimal(8,2) NOT NULL,
  `estado` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

--
-- Volcado de datos para la tabla `ruta`
--

INSERT INTO `ruta` (`id_ruta`, `nombre`, `origen`, `destino`, `distancia_km`, `estado`) VALUES
(1, 'Ruta Paysandu - Montevideo', 'Hospital de Clinicas', 'Montevideo', 380.50, 'ACTIVA'),
(2, 'Ruta Paysandu - Salto', 'Hospital de Clinicas', 'Salto', 120.00, 'ACTIVA'),
(3, 'Ruta Paysandu - Colonia', 'Hospital de Clinicas', 'Colonia del Sacramento', 450.00, 'ACTIVA');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `servicio_hospitalario`
--

CREATE TABLE `servicio_hospitalario` (
  `id_servicio` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(300) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

--
-- Volcado de datos para la tabla `servicio_hospitalario`
--

INSERT INTO `servicio_hospitalario` (`id_servicio`, `nombre`, `descripcion`, `activo`) VALUES
(1, 'Urgencias', 'Atencion de urgencias hospitalarias', 1),
(2, 'Laboratorio', 'Analisis y estudios de laboratorio', 1),
(3, 'Administracion', 'Gestion administrativa del hospital', 1),
(4, 'Consultas externas', 'Atencion medica ambulatoria', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `solicitud_traslado`
--

CREATE TABLE `solicitud_traslado` (
  `id_solicitud` int(11) NOT NULL,
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
  `id_paciente` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

--
-- Volcado de datos para la tabla `solicitud_traslado`
--

INSERT INTO `solicitud_traslado` (`id_solicitud`, `fecha_solicitud`, `salida_programada`, `llegada_estimada`, `prioridad`, `estado_solicitud`, `observaciones`, `id_funcionario_registra`, `id_conductor`, `id_acompanante`, `id_ruta`, `id_ambulancia`, `id_paciente`) VALUES
(1, '2026-09-04 08:00:00', '2026-09-04 10:00:00', '2026-09-04 14:00:00', 'ALTA', 'PENDIENTE', 'Traslado de paciente para consulta especializada', 3, 1, 2, 1, 1, 2),
(2, '2026-09-04 08:30:00', '2026-09-05 09:00:00', '2026-09-05 12:00:00', 'MEDIA', 'PENDIENTE', 'Traslado programado', 3, 1, 2, 2, 2, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_documento`
--

CREATE TABLE `tipo_documento` (
  `id_tipo_documento` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(300) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

--
-- Volcado de datos para la tabla `tipo_documento`
--

INSERT INTO `tipo_documento` (`id_tipo_documento`, `nombre`, `descripcion`) VALUES
(1, 'Informe medico', 'Informes realizados por profesionales de la salud'),
(2, 'Estudio de Laboratorio', 'Resultados y Òrdenes de estudios de laboratorio'),
(3, 'Documento Administrativo', 'Documentaciòn administrativa de  pacientes/hospital'),
(5, 'Resultado de estudio', 'Tipo de documento utilizado por el sistema.');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `traslado`
--

CREATE TABLE `traslado` (
  `id_traslado` int(11) NOT NULL,
  `salida_real` datetime DEFAULT NULL,
  `llegada_real` datetime DEFAULT NULL,
  `inicio_retorno_real` datetime DEFAULT NULL,
  `retorno_real` datetime DEFAULT NULL,
  `observaciones` varchar(500) DEFAULT NULL,
  `id_solicitud` int(11) NOT NULL,
  `id_supervisor` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

--
-- Volcado de datos para la tabla `traslado`
--

INSERT INTO `traslado` (`id_traslado`, `salida_real`, `llegada_real`, `inicio_retorno_real`, `retorno_real`, `observaciones`, `id_solicitud`, `id_supervisor`) VALUES
(1, '2026-09-04 10:05:00', '2026-09-04 13:50:00', '2026-09-04 14:10:00', '2026-09-04 17:30:00', 'Traslado realizado correctamente', 1, 3),
(2, '2026-09-04 10:05:00', '2026-09-04 13:50:00', '2026-09-04 14:10:00', '2026-09-04 17:30:00', 'Traslado realizado correctamente', 2, 3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario`
--

CREATE TABLE `usuario` (
  `id_usuario` int(11) NOT NULL,
  `id_funcionario` int(11) NOT NULL,
  `nombre_usuario` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `estado` varchar(20) NOT NULL DEFAULT 'ACTIVO',
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `ultimo_acceso` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish2_ci;

--
-- Volcado de datos para la tabla `usuario`
--

INSERT INTO `usuario` (`id_usuario`, `id_funcionario`, `nombre_usuario`, `password_hash`, `estado`, `fecha_creacion`, `ultimo_acceso`) VALUES
(1, 4, 'emiliamuniz-17', '$2y$10$29nNMwQXtRw00xfIEw9/8eqXpXnDLqkz9KxYNP8z9WoH28hQWD.Hq', 'ACTIVO', '2026-09-09 18:42:18', NULL),
(2, 2, 'Carlos.Rodriguez', '$2y$10$mxUBc4X52FgPqnl89vDr1.1bTw9DvIAYhd.DTTgiHNHmdkpHx3kEW', 'ACTIVO', '2026-09-09 19:19:09', '2026-09-09 19:19:41'),
(3, 3, 'LuciaFernandez-1988', '$2y$10$q6S80yde/3pS2nrT4n2eoebdNddBEA5FjtuVgA65eO5UsX4JlBLg2', 'ACTIVO', '2026-09-10 09:11:12', '2026-09-10 09:12:24');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `ambulancia`
--
ALTER TABLE `ambulancia`
  ADD PRIMARY KEY (`id_ambulancia`),
  ADD UNIQUE KEY `matricula` (`matricula`);

--
-- Indices de la tabla `carga_transportada`
--
ALTER TABLE `carga_transportada`
  ADD PRIMARY KEY (`id_carga`),
  ADD KEY `fk_carga_solicitud` (`id_solicitud`);

--
-- Indices de la tabla `documento`
--
ALTER TABLE `documento`
  ADD PRIMARY KEY (`id_documento`),
  ADD KEY `fk_documento_tipo` (`id_tipo_documento`),
  ADD KEY `fk_documento_funcionario` (`id_funcionario_carga`);

--
-- Indices de la tabla `encuesta`
--
ALTER TABLE `encuesta`
  ADD PRIMARY KEY (`id_encuesta`),
  ADD KEY `fk_encuesta_servicio` (`id_servicio`),
  ADD KEY `fk_encuesta_funcionario` (`id_funcionario_crea`);

--
-- Indices de la tabla `envio_encuesta`
--
ALTER TABLE `envio_encuesta`
  ADD PRIMARY KEY (`id_envio`),
  ADD KEY `id_encuesta` (`id_encuesta`),
  ADD KEY `id_persona` (`id_persona`);

--
-- Indices de la tabla `funcionario`
--
ALTER TABLE `funcionario`
  ADD PRIMARY KEY (`id_persona`),
  ADD UNIQUE KEY `legajo` (`legajo`);

--
-- Indices de la tabla `historial_estado`
--
ALTER TABLE `historial_estado`
  ADD PRIMARY KEY (`id_historial`),
  ADD KEY `fk_historial_traslado` (`id_traslado`),
  ADD KEY `fk_historial_funcionario` (`id_funcionario_registra`);

--
-- Indices de la tabla `paciente`
--
ALTER TABLE `paciente`
  ADD PRIMARY KEY (`id_persona`),
  ADD UNIQUE KEY `nro_historia` (`nro_historia`);

--
-- Indices de la tabla `persona`
--
ALTER TABLE `persona`
  ADD PRIMARY KEY (`id_persona`),
  ADD UNIQUE KEY `cedula` (`cedula`);

--
-- Indices de la tabla `pregunta`
--
ALTER TABLE `pregunta`
  ADD PRIMARY KEY (`id_pregunta`),
  ADD KEY `id_encuesta` (`id_encuesta`);

--
-- Indices de la tabla `qr`
--
ALTER TABLE `qr`
  ADD PRIMARY KEY (`id_qr`),
  ADD UNIQUE KEY `token` (`token`),
  ADD UNIQUE KEY `id_documento` (`id_documento`);

--
-- Indices de la tabla `respuesta`
--
ALTER TABLE `respuesta`
  ADD PRIMARY KEY (`id_respuesta`),
  ADD UNIQUE KEY `uq_respuesta_envio_pregunta` (`id_envio`,`id_pregunta`),
  ADD KEY `id_pregunta` (`id_pregunta`);

--
-- Indices de la tabla `ruta`
--
ALTER TABLE `ruta`
  ADD PRIMARY KEY (`id_ruta`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `servicio_hospitalario`
--
ALTER TABLE `servicio_hospitalario`
  ADD PRIMARY KEY (`id_servicio`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `solicitud_traslado`
--
ALTER TABLE `solicitud_traslado`
  ADD PRIMARY KEY (`id_solicitud`),
  ADD KEY `fk_solicitud_registra` (`id_funcionario_registra`),
  ADD KEY `fk_solicitud_conductor` (`id_conductor`),
  ADD KEY `fk_solicitud_acompanante` (`id_acompanante`),
  ADD KEY `fk_solicitud_ruta` (`id_ruta`),
  ADD KEY `fk_solicitud_ambulancia` (`id_ambulancia`),
  ADD KEY `fk_solicitud_paciente` (`id_paciente`);

--
-- Indices de la tabla `tipo_documento`
--
ALTER TABLE `tipo_documento`
  ADD PRIMARY KEY (`id_tipo_documento`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `traslado`
--
ALTER TABLE `traslado`
  ADD PRIMARY KEY (`id_traslado`),
  ADD UNIQUE KEY `id_solicitud` (`id_solicitud`),
  ADD KEY `fk_traslado_supervisor` (`id_supervisor`);

--
-- Indices de la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `id_funcionario` (`id_funcionario`),
  ADD UNIQUE KEY `nombre_usuario` (`nombre_usuario`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `ambulancia`
--
ALTER TABLE `ambulancia`
  MODIFY `id_ambulancia` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `carga_transportada`
--
ALTER TABLE `carga_transportada`
  MODIFY `id_carga` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `documento`
--
ALTER TABLE `documento`
  MODIFY `id_documento` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `encuesta`
--
ALTER TABLE `encuesta`
  MODIFY `id_encuesta` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `envio_encuesta`
--
ALTER TABLE `envio_encuesta`
  MODIFY `id_envio` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `historial_estado`
--
ALTER TABLE `historial_estado`
  MODIFY `id_historial` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `persona`
--
ALTER TABLE `persona`
  MODIFY `id_persona` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `pregunta`
--
ALTER TABLE `pregunta`
  MODIFY `id_pregunta` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `qr`
--
ALTER TABLE `qr`
  MODIFY `id_qr` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `respuesta`
--
ALTER TABLE `respuesta`
  MODIFY `id_respuesta` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `ruta`
--
ALTER TABLE `ruta`
  MODIFY `id_ruta` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `servicio_hospitalario`
--
ALTER TABLE `servicio_hospitalario`
  MODIFY `id_servicio` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `solicitud_traslado`
--
ALTER TABLE `solicitud_traslado`
  MODIFY `id_solicitud` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `tipo_documento`
--
ALTER TABLE `tipo_documento`
  MODIFY `id_tipo_documento` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `traslado`
--
ALTER TABLE `traslado`
  MODIFY `id_traslado` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `usuario`
--
ALTER TABLE `usuario`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `carga_transportada`
--
ALTER TABLE `carga_transportada`
  ADD CONSTRAINT `fk_carga_solicitud` FOREIGN KEY (`id_solicitud`) REFERENCES `solicitud_traslado` (`id_solicitud`);

--
-- Filtros para la tabla `documento`
--
ALTER TABLE `documento`
  ADD CONSTRAINT `fk_documento_funcionario` FOREIGN KEY (`id_funcionario_carga`) REFERENCES `funcionario` (`id_persona`),
  ADD CONSTRAINT `fk_documento_tipo` FOREIGN KEY (`id_tipo_documento`) REFERENCES `tipo_documento` (`id_tipo_documento`);

--
-- Filtros para la tabla `encuesta`
--
ALTER TABLE `encuesta`
  ADD CONSTRAINT `fk_encuesta_funcionario` FOREIGN KEY (`id_funcionario_crea`) REFERENCES `funcionario` (`id_persona`),
  ADD CONSTRAINT `fk_encuesta_servicio` FOREIGN KEY (`id_servicio`) REFERENCES `servicio_hospitalario` (`id_servicio`);

--
-- Filtros para la tabla `envio_encuesta`
--
ALTER TABLE `envio_encuesta`
  ADD CONSTRAINT `envio_encuesta_ibfk_1` FOREIGN KEY (`id_encuesta`) REFERENCES `encuesta` (`id_encuesta`),
  ADD CONSTRAINT `envio_encuesta_ibfk_2` FOREIGN KEY (`id_persona`) REFERENCES `persona` (`id_persona`);

--
-- Filtros para la tabla `funcionario`
--
ALTER TABLE `funcionario`
  ADD CONSTRAINT `funcionario_ibfk_1` FOREIGN KEY (`id_persona`) REFERENCES `persona` (`id_persona`);

--
-- Filtros para la tabla `historial_estado`
--
ALTER TABLE `historial_estado`
  ADD CONSTRAINT `fk_historial_funcionario` FOREIGN KEY (`id_funcionario_registra`) REFERENCES `funcionario` (`id_persona`),
  ADD CONSTRAINT `fk_historial_traslado` FOREIGN KEY (`id_traslado`) REFERENCES `traslado` (`id_traslado`);

--
-- Filtros para la tabla `paciente`
--
ALTER TABLE `paciente`
  ADD CONSTRAINT `paciente_ibfk_1` FOREIGN KEY (`id_persona`) REFERENCES `persona` (`id_persona`);

--
-- Filtros para la tabla `pregunta`
--
ALTER TABLE `pregunta`
  ADD CONSTRAINT `pregunta_ibfk_1` FOREIGN KEY (`id_encuesta`) REFERENCES `encuesta` (`id_encuesta`);

--
-- Filtros para la tabla `qr`
--
ALTER TABLE `qr`
  ADD CONSTRAINT `qr_ibfk_1` FOREIGN KEY (`id_documento`) REFERENCES `documento` (`id_documento`);

--
-- Filtros para la tabla `respuesta`
--
ALTER TABLE `respuesta`
  ADD CONSTRAINT `respuesta_ibfk_1` FOREIGN KEY (`id_envio`) REFERENCES `envio_encuesta` (`id_envio`),
  ADD CONSTRAINT `respuesta_ibfk_2` FOREIGN KEY (`id_pregunta`) REFERENCES `pregunta` (`id_pregunta`);

--
-- Filtros para la tabla `solicitud_traslado`
--
ALTER TABLE `solicitud_traslado`
  ADD CONSTRAINT `fk_solicitud_acompanante` FOREIGN KEY (`id_acompanante`) REFERENCES `persona` (`id_persona`),
  ADD CONSTRAINT `fk_solicitud_ambulancia` FOREIGN KEY (`id_ambulancia`) REFERENCES `ambulancia` (`id_ambulancia`),
  ADD CONSTRAINT `fk_solicitud_conductor` FOREIGN KEY (`id_conductor`) REFERENCES `funcionario` (`id_persona`),
  ADD CONSTRAINT `fk_solicitud_paciente` FOREIGN KEY (`id_paciente`) REFERENCES `paciente` (`id_persona`),
  ADD CONSTRAINT `fk_solicitud_registra` FOREIGN KEY (`id_funcionario_registra`) REFERENCES `funcionario` (`id_persona`),
  ADD CONSTRAINT `fk_solicitud_ruta` FOREIGN KEY (`id_ruta`) REFERENCES `ruta` (`id_ruta`);

--
-- Filtros para la tabla `traslado`
--
ALTER TABLE `traslado`
  ADD CONSTRAINT `fk_traslado_solicitud` FOREIGN KEY (`id_solicitud`) REFERENCES `solicitud_traslado` (`id_solicitud`),
  ADD CONSTRAINT `fk_traslado_supervisor` FOREIGN KEY (`id_supervisor`) REFERENCES `funcionario` (`id_persona`);

--
-- Filtros para la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD CONSTRAINT `fk_usuario_funcionario` FOREIGN KEY (`id_funcionario`) REFERENCES `funcionario` (`id_persona`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
