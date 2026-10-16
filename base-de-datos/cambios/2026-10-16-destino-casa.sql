-- Traslados a una dirección cualquiera (por ejemplo, la casa de un paciente) (16/10/2026).
-- Ejecutar después de 2026-10-16-simplificar.sql.
--
-- El destino puede ser uno de Gestión → Destinos (id_destino) o una dirección escrita a mano
-- (destino_direccion + su ubicación en el mapa). Uno de los dos tiene que estar.

ALTER TABLE `gestion_traslado`
  MODIFY `id_destino` int(11) DEFAULT NULL COMMENT 'gestion_destino (vacío si se escribió una dirección)',
  ADD COLUMN `destino_direccion` varchar(200) DEFAULT NULL COMMENT 'dirección escrita a mano, ej. una casa' AFTER `id_destino`,
  ADD COLUMN `destino_lat` decimal(9,6) DEFAULT NULL COMMENT 'ubicación de destino_direccion en el mapa' AFTER `destino_direccion`,
  ADD COLUMN `destino_lng` decimal(9,6) DEFAULT NULL AFTER `destino_lat`;
