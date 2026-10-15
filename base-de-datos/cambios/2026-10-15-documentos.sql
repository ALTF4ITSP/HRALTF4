-- Documentos: se guarda el paciente (el formulario lo pedía pero no había dónde guardarlo).
-- No borra nada.
ALTER TABLE `documento`
  ADD COLUMN IF NOT EXISTS `paciente` varchar(100) DEFAULT NULL COMMENT 'Nombre o cédula del paciente' AFTER `descripcion`;
