-- Documentos: se quita el paciente (ya no se pide) y cada documento tiene su código QR
-- en la tabla `qr`, que ya existía. No borra documentos.
ALTER TABLE `documento` DROP COLUMN IF EXISTS `paciente`;
