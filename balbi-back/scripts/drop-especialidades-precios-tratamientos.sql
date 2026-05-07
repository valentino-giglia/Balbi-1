-- =============================================================================
-- Script para eliminar entidades: especialidades, precios y tratamientos
-- Ejecutar sobre la base de datos existente.
--   mysql -u USUARIO -p cordoba_nutricion < scripts/drop-especialidades-precios-tratamientos.sql
-- =============================================================================

USE cordoba_nutricion;

-- 1. Turnos: quitar FKs y columnas especialidadID y tratamientoID
ALTER TABLE turnos
  DROP FOREIGN KEY fk_turnos_especialidad,
  DROP FOREIGN KEY fk_turnos_tratamiento;

ALTER TABLE turnos
  DROP INDEX idx_turnos_especialidadID,
  DROP INDEX idx_turnos_tratamientoID,
  DROP COLUMN especialidadID,
  DROP COLUMN tratamientoID;

-- 2. Tabla intermedia profesionales-especialidades (N:M)
DROP TABLE IF EXISTS profesionales_especialidades;

-- 3. Tablas de entidades
DROP TABLE IF EXISTS especialidades;
DROP TABLE IF EXISTS tratamientos;
DROP TABLE IF EXISTS precios;

-- =============================================================================
-- Fin del script
-- =============================================================================
