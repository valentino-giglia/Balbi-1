-- =============================================================================
-- Script para eliminar todo lo relacionado a sesiones de la base de datos
-- Córdoba Nutrición
--
-- Ejecutar sobre la BD existente:
--   mysql -u USUARIO -p cordoba_nutricion < scripts/drop-sesiones.sql
--
-- Este script:
-- 1. Elimina la tabla sesiones_precios (FK a sesiones y precios)
-- 2. Elimina la tabla sesiones_turnos (FK a sesiones y turnos)
-- 3. Elimina la tabla sesiones (FK a pacientes y precios)
-- =============================================================================

USE cordoba_nutricion;

-- Eliminar tablas en orden (primero las que tienen FK a sesiones)
DROP TABLE IF EXISTS sesiones_precios;
DROP TABLE IF EXISTS sesiones_turnos;
DROP TABLE IF EXISTS sesiones;
