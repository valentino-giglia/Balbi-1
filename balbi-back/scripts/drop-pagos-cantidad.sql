-- =============================================================================
-- Eliminar columna cantidad de la tabla pagos
--   mysql -u USUARIO -p cordoba_nutricion < scripts/drop-pagos-cantidad.sql
-- =============================================================================

USE cordoba_nutricion;

ALTER TABLE pagos DROP COLUMN cantidad;
