-- Eliminar columna turnos_disponibles de pacientes y servicios
-- Ejecutar contra la base de datos antes de desplegar el código que ya no usa este campo.
--
-- Opción A: MySQL 8.0.23+ (o MariaDB con sintaxis equivalente)
-- 1. Eliminar turnos_disponibles de pacientes
ALTER TABLE pacientes DROP COLUMN IF EXISTS turnos_disponibles;

-- 2. Eliminar turnos_disponibles de servicios
ALTER TABLE servicios DROP COLUMN IF EXISTS turnos_disponibles;

--
-- Opción B: Si DROP COLUMN IF EXISTS no está soportado (MySQL < 8.0.23),
-- ejecutar solo estas dos líneas (fallará si la columna ya no existe):
-- ALTER TABLE pacientes DROP COLUMN turnos_disponibles;
-- ALTER TABLE servicios DROP COLUMN turnos_disponibles;
