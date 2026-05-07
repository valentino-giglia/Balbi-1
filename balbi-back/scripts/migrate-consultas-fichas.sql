-- =============================================================================
-- Migración: Consultas, Fichas y campos extra en Servicios
-- Ejecutar sobre la base de datos existente (cordoba_nutricion)
-- =============================================================================

USE cordoba_nutricion;

-- Tabla consultas (datos de la consulta médica)
CREATE TABLE IF NOT EXISTS consultas (
  id INT NOT NULL AUTO_INCREMENT,
  nota TEXT NULL,
  extra JSON NULL COMMENT 'Datos extra de la consulta (estructura desde servicio)',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla fichas (ficha de completado inicial del paciente)
CREATE TABLE IF NOT EXISTS fichas (
  id INT NOT NULL AUTO_INCREMENT,
  pacienteID INT NOT NULL,
  notas TEXT NULL,
  extra JSON NULL COMMENT 'Datos extra de la ficha (estructura desde servicio)',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_fichas_pacienteID (pacienteID),
  CONSTRAINT fk_fichas_paciente FOREIGN KEY (pacienteID) REFERENCES pacientes (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Campos en servicios para estructura por defecto del JSON (consulta y ficha)
-- Si ya existen, omitir estas líneas o ejecutar una por vez y omitir las que fallen.
ALTER TABLE servicios ADD COLUMN default_extra_consulta JSON NULL COMMENT 'Estructura JSON por defecto para extra de Consulta';
ALTER TABLE servicios ADD COLUMN default_extra_ficha JSON NULL COMMENT 'Estructura JSON por defecto para extra de Ficha';

-- Columna consultaID en turnos (relación 1:1 opcional)
ALTER TABLE turnos ADD COLUMN consultaID INT NULL AFTER notas;
ALTER TABLE turnos ADD KEY idx_turnos_consultaID (consultaID);
ALTER TABLE turnos ADD CONSTRAINT fk_turnos_consulta FOREIGN KEY (consultaID) REFERENCES consultas (id) ON DELETE SET NULL ON UPDATE CASCADE;
