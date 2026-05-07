-- =============================================================================
-- Migración: Pagos + turnos_disponibles (pacientes y servicios)
-- Base de datos: MySQL (cordoba_nutricion)
-- Ejecutar sobre la base ya existente. Es idempotente: se puede correr más de una vez.
-- =============================================================================

USE cordoba_nutricion;

-- -----------------------------------------------------------------------------
-- 1. Agregar turnos_disponibles a pacientes (si no existe)
-- -----------------------------------------------------------------------------
SET @dbname = DATABASE();
SET @tabla = 'pacientes';
SET @columna = 'turnos_disponibles';
SET @prepared = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tabla AND COLUMN_NAME = @columna);

SET @sql = IF(@prepared = 0,
  'ALTER TABLE pacientes ADD COLUMN turnos_disponibles INT NOT NULL DEFAULT 0 AFTER sn_derivado',
  'SELECT 1 AS ya_existe_pacientes_turnos_disponibles');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- -----------------------------------------------------------------------------
-- 2. Agregar turnos_disponibles a servicios (si no existe)
-- -----------------------------------------------------------------------------
SET @tabla = 'servicios';
SET @prepared = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tabla AND COLUMN_NAME = @columna);

SET @sql = IF(@prepared = 0,
  'ALTER TABLE servicios ADD COLUMN turnos_disponibles INT NOT NULL DEFAULT 1 AFTER color',
  'SELECT 1 AS ya_existe_servicios_turnos_disponibles');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- -----------------------------------------------------------------------------
-- 3. Crear tabla pagos (si no existe)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pagos (
  id INT NOT NULL AUTO_INCREMENT,
  pacienteID INT NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  monto DECIMAL(10, 2) NOT NULL,
  metodoPago ENUM('TRANSFERENCIA', 'EFECTIVO') NOT NULL,
  estado ENUM('PENDIENTE', 'COBRADO', 'CANCELADO') NOT NULL DEFAULT 'COBRADO',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pagos_pacienteID (pacienteID),
  CONSTRAINT fk_pagos_paciente FOREIGN KEY (pacienteID) REFERENCES pacientes (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. Crear tabla pagos_servicios (si no existe)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pagos_servicios (
  id INT NOT NULL AUTO_INCREMENT,
  pagoID INT NOT NULL,
  servicioID INT NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pagos_servicios_pagoID (pagoID),
  KEY idx_pagos_servicios_servicioID (servicioID),
  CONSTRAINT fk_pagos_servicios_pago FOREIGN KEY (pagoID) REFERENCES pagos (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_pagos_servicios_servicio FOREIGN KEY (servicioID) REFERENCES servicios (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. Crear tabla pagos_talleres (si no existe)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pagos_talleres (
  id INT NOT NULL AUTO_INCREMENT,
  pagoID INT NOT NULL,
  tallerID INT NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pagos_talleres_pagoID (pagoID),
  KEY idx_pagos_talleres_tallerID (tallerID),
  CONSTRAINT fk_pagos_talleres_pago FOREIGN KEY (pagoID) REFERENCES pagos (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_pagos_talleres_taller FOREIGN KEY (tallerID) REFERENCES talleres (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- Fin de la migración
-- =============================================================================
