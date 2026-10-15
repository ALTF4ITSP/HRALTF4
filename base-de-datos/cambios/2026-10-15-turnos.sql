-- Turnos de pacientes para el Calendario.
-- Necesita las tablas de Gestión (2026-10-15-gestion.sql). No borra nada.

CREATE TABLE IF NOT EXISTS `turno` (
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
INSERT IGNORE INTO `turno`
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
