-- =============================================================================
-- Script para eliminar todo lo relacionado a obras sociales de la base de datos
-- Córdoba Nutrición
--
-- Ejecutar sobre la BD existente:
--   mysql -u USUARIO -p cordoba_nutricion < scripts/drop-obras-sociales.sql
--
-- Este script:
-- 1. Elimina la FK de turnos a planes_obra_social
-- 2. Elimina la columna planObraSocialID de turnos
-- 3. Elimina las tablas planes_obra_social y obras_sociales
-- =============================================================================

USE cordoba_nutricion;

-- Eliminar FK y columna planObraSocialID de turnos
ALTER TABLE turnos DROP FOREIGN KEY fk_turnos_plan_obra_social;
ALTER TABLE turnos DROP COLUMN planObraSocialID;

-- Eliminar tablas (orden: planes depende de obras_sociales)
DROP TABLE IF EXISTS planes_obra_social;
DROP TABLE IF EXISTS obras_sociales;
