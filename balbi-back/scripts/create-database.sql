-- =============================================================================
-- Script de creación de base de datos - Córdoba Nutrición Backend
-- Base de datos: MySQL
-- Generado a partir de los modelos Sequelize
-- =============================================================================

-- Crear y usar la base de datos
-- Reemplazar 'cordoba_nutricion' por el valor de DB_NAME en tu .env
DROP DATABASE IF EXISTS cordoba_nutricion;
CREATE DATABASE cordoba_nutricion
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE cordoba_nutricion;

-- =============================================================================
-- TABLAS PRINCIPALES (sin dependencias de FK)
-- =============================================================================

-- Roles de usuario
CREATE TABLE roles (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL,
  estado ENUM('ACTIVO', 'INACTIVO', 'BAJA') NOT NULL DEFAULT 'ACTIVO',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usuarios
CREATE TABLE usuarios (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefono VARCHAR(255) NULL,
  contrasena VARCHAR(255) NOT NULL,
  estado ENUM('ACTIVO', 'INACTIVO', 'BAJA') NOT NULL DEFAULT 'ACTIVO',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_usuarios_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Profesionales
CREATE TABLE profesionales (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL,
  codigo VARCHAR(50) NULL,
  telefono VARCHAR(50) NULL,
  email VARCHAR(255) NULL,
  color VARCHAR(7) NULL DEFAULT '#1976d2',
  detalles TEXT NULL,
  estado ENUM('ACTIVO', 'INACTIVO', 'BAJA') NOT NULL DEFAULT 'ACTIVO',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_profesionales_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pacientes
CREATE TABLE pacientes (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(255) NULL,
  telefono VARCHAR(50) NULL,
  email VARCHAR(255) NULL,
  dni VARCHAR(20) NULL,
  kapso_phone_number_id VARCHAR(255) NULL,
  kapso_conversation_id VARCHAR(255) NULL,
  kapso_agent_status ENUM('ON', 'OFF') NOT NULL DEFAULT 'ON',
  sn_derivado TINYINT(1) NOT NULL DEFAULT 0,
  estado ENUM('ACTIVO', 'INACTIVO', 'BAJA') NOT NULL DEFAULT 'ACTIVO',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pacientes_sn_derivado (sn_derivado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Campos personalizados para extras de consulta y ficha
CREATE TABLE custom_fields (
  id INT NOT NULL AUTO_INCREMENT,
  `key` VARCHAR(100) NOT NULL,
  label VARCHAR(255) NOT NULL,
  type ENUM('text', 'number', 'date', 'textarea', 'link') NULL DEFAULT 'text',
  scope ENUM('consulta', 'ficha') NOT NULL DEFAULT 'consulta',
  orden INT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_custom_fields_key (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE servicios (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL,
  codigo VARCHAR(50) NOT NULL,
  duracionMinutos INT NOT NULL DEFAULT 30,
  color VARCHAR(7) NULL DEFAULT '#1976d2',
  precio DECIMAL(10, 2) NULL DEFAULT 0 COMMENT 'Precio por defecto para usar en pagos',
  estado ENUM('ACTIVO', 'INACTIVO', 'BAJA') NOT NULL DEFAULT 'ACTIVO',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_servicios_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Consultas (datos de la consulta médica, vinculada a turno vía turnos.consultaID)
CREATE TABLE consultas (
  id INT NOT NULL AUTO_INCREMENT,
  nota TEXT NULL,
  extra JSON NULL COMMENT 'Datos extra de la consulta (estructura desde servicio)',
  motivoConsulta TEXT NULL COMMENT 'Motivo de consulta / anamnesis',
  examenClinico TEXT NULL COMMENT 'Examen clínico',
  diagnostico TEXT NULL COMMENT 'Diagnóstico',
  planTratamiento TEXT NULL COMMENT 'Plan / tratamiento',
  pesoKg DECIMAL(6, 2) NULL COMMENT 'Peso en kg al momento de la atención',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fichas (ficha de completado inicial del paciente)
CREATE TABLE fichas (
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

-- =============================================================================
-- TABLAS CON DEPENDENCIAS
-- =============================================================================

-- Usuario-Rol (N:M)
CREATE TABLE usuario_roles (
  id INT NOT NULL AUTO_INCREMENT,
  rolID INT NOT NULL,
  usuarioID INT NOT NULL,
  estado ENUM('ACTIVO', 'INACTIVO', 'BAJA') NOT NULL DEFAULT 'ACTIVO',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_usuario_roles_rolID (rolID),
  KEY idx_usuario_roles_usuarioID (usuarioID),
  CONSTRAINT fk_usuario_roles_rol FOREIGN KEY (rolID) REFERENCES roles (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_usuario_roles_usuario FOREIGN KEY (usuarioID) REFERENCES usuarios (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Horarios (por profesional)
CREATE TABLE horarios (
  id INT NOT NULL AUTO_INCREMENT,
  profesionalID INT NOT NULL,
  diaSemana VARCHAR(15) NOT NULL,
  horaInicio TIME NOT NULL,
  horaFin TIME NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_horarios_profesionalID (profesionalID),
  CONSTRAINT fk_horarios_profesional FOREIGN KEY (profesionalID) REFERENCES profesionales (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Profesionales-Servicios (N:M)
CREATE TABLE profesionales_servicios (
  id INT NOT NULL AUTO_INCREMENT,
  profesionalID INT NOT NULL,
  servicioID INT NOT NULL,
  estado ENUM('ACTIVO', 'INACTIVO', 'BAJA') NOT NULL DEFAULT 'ACTIVO',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_profesional_servicio (profesionalID, servicioID),
  KEY idx_prof_serv_profesionalID (profesionalID),
  KEY idx_prof_serv_servicioID (servicioID),
  CONSTRAINT fk_prof_serv_profesional FOREIGN KEY (profesionalID) REFERENCES profesionales (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_prof_serv_servicio FOREIGN KEY (servicioID) REFERENCES servicios (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Turnos
CREATE TABLE turnos (
  id INT NOT NULL AUTO_INCREMENT,
  pacienteID INT NULL,
  profesionalID INT NOT NULL,
  servicioID INT NOT NULL,
  precio DECIMAL(10, 2) NULL,
  horaInicio DATETIME NOT NULL,
  horaFin DATETIME NOT NULL,
  duracionMinutos INT NOT NULL,
  estado ENUM('RESERVADO', 'PENDIENTE', 'CANCELADO', 'COMPLETADO', 'BAJA') NOT NULL DEFAULT 'RESERVADO',
  notas TEXT NULL,
  consultaID INT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_turnos_pacienteID (pacienteID),
  KEY idx_turnos_profesionalID (profesionalID),
  KEY idx_turnos_servicioID (servicioID),
  KEY idx_turnos_consultaID (consultaID),
  CONSTRAINT fk_turnos_paciente FOREIGN KEY (pacienteID) REFERENCES pacientes (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_turnos_profesional FOREIGN KEY (profesionalID) REFERENCES profesionales (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_turnos_servicio FOREIGN KEY (servicioID) REFERENCES servicios (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_turnos_consulta FOREIGN KEY (consultaID) REFERENCES consultas (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- MÓDULO EVENTOS Y TALLERES
-- =============================================================================

-- Talleres (nombre, codigo, precio)
CREATE TABLE talleres (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL,
  codigo VARCHAR(50) NOT NULL,
  precio DECIMAL(10, 2) NULL DEFAULT 0 COMMENT 'Precio por defecto para usar en pagos',
  estado ENUM('ACTIVO', 'INACTIVO', 'BAJA') NOT NULL DEFAULT 'ACTIVO',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_talleres_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pagos (un pago = un servicio o un taller por fila)
CREATE TABLE pagos (
  id INT NOT NULL AUTO_INCREMENT,
  pacienteID INT NOT NULL,
  servicioID INT NULL,
  tallerID INT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  monto DECIMAL(10, 2) NOT NULL,
  metodoPago ENUM('TRANSFERENCIA', 'EFECTIVO') NOT NULL,
  estado ENUM('PENDIENTE', 'COBRADO', 'CANCELADO') NOT NULL DEFAULT 'COBRADO',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pagos_pacienteID (pacienteID),
  KEY idx_pagos_servicioID (servicioID),
  KEY idx_pagos_tallerID (tallerID),
  CONSTRAINT fk_pagos_paciente FOREIGN KEY (pacienteID) REFERENCES pacientes (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_pagos_servicio FOREIGN KEY (servicioID) REFERENCES servicios (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_pagos_taller FOREIGN KEY (tallerID) REFERENCES talleres (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Eventos (similar a turnos, con taller en vez de servicio; cupo opcional, link Meet opcional)
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

-- Eventos-Pacientes (N:M)
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
-- FIN DEL SCRIPT
-- =============================================================================
