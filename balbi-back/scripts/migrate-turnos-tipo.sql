-- =============================================================================
-- Migración: Tipo de turno (CONSULTORIO, DOMICILIO, INTERNACION)
-- Ejecutar sobre la base de datos existente.
-- Si la columna ya existe, ejecutar solo la línea MODIFY.
-- =============================================================================

-- Agregar columna tipo (omitir si ya existe)
ALTER TABLE turnos ADD COLUMN tipo ENUM('CONSULTORIO', 'DOMICILIO', 'INTERNACION') NOT NULL DEFAULT 'CONSULTORIO' AFTER consultaID;

-- Si la columna ya fue agregada sin INTERNACION, actualizar el ENUM:
-- ALTER TABLE turnos MODIFY COLUMN tipo ENUM('CONSULTORIO', 'DOMICILIO', 'INTERNACION') NOT NULL DEFAULT 'CONSULTORIO';
