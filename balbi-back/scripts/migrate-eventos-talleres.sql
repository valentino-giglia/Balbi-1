-- =============================================================================
-- Migración: Módulo Eventos y Talleres
-- Los eventos son similares a turnos pero con talleres en vez de servicios.
-- Eventos: cupo máximo opcional, link Meet opcional. Relación N:M con pacientes.
-- Talleres: nombre, codigo.
-- =============================================================================

USE cordoba_nutricion;

-- -----------------------------------------------------------------------------
-- Tabla: talleres
-- -----------------------------------------------------------------------------
CREATE TABLE talleres (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL,
  codigo VARCHAR(50) NOT NULL,
  estado ENUM('ACTIVO', 'INACTIVO', 'BAJA') NOT NULL DEFAULT 'ACTIVO',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_talleres_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Tabla: eventos
-- -----------------------------------------------------------------------------
CREATE TABLE eventos (
  id INT NOT NULL AUTO_INCREMENT,
  tallerID INT NOT NULL,
  profesionalID INT NULL,
  horaInicio DATETIME NOT NULL,
  horaFin DATETIME NOT NULL,
  duracionMinutos INT NOT NULL,
  cupoMaximo INT NULL COMMENT 'Cantidad máxima opcional de pacientes',
  linkMeet VARCHAR(500) NULL COMMENT 'Link opcional a Google Meet',
  estado ENUM('RESERVADO', 'PENDIENTE', 'CANCELADO', 'COMPLETADO', 'BAJA') NOT NULL DEFAULT 'RESERVADO',
  notas TEXT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_eventos_tallerID (tallerID),
  KEY idx_eventos_profesionalID (profesionalID),
  KEY idx_eventos_horaInicio (horaInicio),
  CONSTRAINT fk_eventos_taller FOREIGN KEY (tallerID) REFERENCES talleres (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_eventos_profesional FOREIGN KEY (profesionalID) REFERENCES profesionales (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Tabla: eventos_pacientes (N:M evento - paciente)
-- -----------------------------------------------------------------------------
CREATE TABLE eventos_pacientes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  eventoID INT NOT NULL,
  pacienteID INT NOT NULL,
  estado ENUM('PENDIENTE', 'RESERVADO', 'CANCELADO', 'COMPLETADO', 'BAJA') NOT NULL DEFAULT 'RESERVADO',
  notas TEXT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_evento_paciente (eventoID, pacienteID),
  KEY idx_eventos_pacientes_eventoID (eventoID),
  KEY idx_eventos_pacientes_pacienteID (pacienteID),
  CONSTRAINT fk_ev_pac_evento FOREIGN KEY (eventoID) REFERENCES eventos (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ev_pac_paciente FOREIGN KEY (pacienteID) REFERENCES pacientes (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- FIN MIGRACIÓN
-- =============================================================================
