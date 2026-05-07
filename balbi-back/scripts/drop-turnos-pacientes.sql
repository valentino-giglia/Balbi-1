-- =============================================================================
-- Script para eliminar la tabla turnos_pacientes (no se usa)
-- Ejecutar sobre la base de datos existente.
--   mysql -u USUARIO -p cordoba_nutricion < scripts/drop-turnos-pacientes.sql
-- =============================================================================

USE cordoba_nutricion;

DROP TABLE IF EXISTS turnos_pacientes;

-- =============================================================================
-- Fin del script
-- =============================================================================
