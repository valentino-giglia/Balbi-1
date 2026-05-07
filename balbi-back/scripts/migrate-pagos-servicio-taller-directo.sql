-- =============================================================================
-- Migración: pagos con servicioID y tallerID directos (sin pagos_servicios ni pagos_talleres)
-- Borra todos los pagos y las tablas de detalle, altera pagos.
-- Ejecutar sobre la base de datos existente.
--   mysql -u USUARIO -p cordoba_nutricion < scripts/migrate-pagos-servicio-taller-directo.sql
-- =============================================================================

USE cordoba_nutricion;

-- 1. Borrar todos los pagos (no se migran datos)
DELETE FROM pagos;

-- 2. Eliminar tablas de detalle
DROP TABLE IF EXISTS pagos_talleres;
DROP TABLE IF EXISTS pagos_servicios;

-- 3. Agregar columnas a pagos (servicioID, tallerID)
ALTER TABLE pagos
  ADD COLUMN servicioID INT NULL AFTER pacienteID,
  ADD COLUMN tallerID INT NULL AFTER servicioID;

-- 4. Índices y FKs (talleres y servicios ya existen)
ALTER TABLE pagos
  ADD KEY idx_pagos_servicioID (servicioID),
  ADD KEY idx_pagos_tallerID (tallerID),
  ADD CONSTRAINT fk_pagos_servicio FOREIGN KEY (servicioID) REFERENCES servicios (id) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_pagos_taller FOREIGN KEY (tallerID) REFERENCES talleres (id) ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- Fin del script
-- =============================================================================
