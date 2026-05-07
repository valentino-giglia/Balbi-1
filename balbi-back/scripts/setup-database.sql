-- =============================================================================
-- ARMADO COMPLETO DE BASE DE DATOS - Córdoba Nutrición
-- MySQL - Un solo archivo: esquema + tabla files + datos iniciales
--
-- Uso: mysql -u USUARIO -p < scripts/setup-database.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. CREAR BASE DE DATOS Y TABLAS
-- -----------------------------------------------------------------------------


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

-- -----------------------------------------------------------------------------
-- 2. TABLA FILES (archivos por paciente, Firebase Storage)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS files (
  id INT NOT NULL AUTO_INCREMENT,
  storagePath VARCHAR(512) NOT NULL COMMENT 'Ruta del archivo en el bucket (ej: pacientes/123/abc.jpg)',
  pacienteID INT NOT NULL,
  nombreArchivo VARCHAR(255) NULL COMMENT 'Nombre original del archivo',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_files_pacienteID (pacienteID),
  CONSTRAINT fk_files_paciente FOREIGN KEY (pacienteID) REFERENCES pacientes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. DATOS INICIALES (seed)
-- Usuarios: Lore, Pao | Contraseña: password
-- -----------------------------------------------------------------------------

SET @pwd_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

INSERT INTO roles (id, nombre, estado) VALUES
(1, 'Administrador', 'ACTIVO')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), estado = VALUES(estado);

INSERT INTO usuarios (id, nombre, email, telefono, contrasena, estado) VALUES
(1, 'persona1', 'persona1@gmail.com', NULL, @pwd_hash, 'ACTIVO'),
(2, 'persona2', 'persona2@gmail.com', NULL, @pwd_hash, 'ACTIVO')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), contrasena = VALUES(contrasena), estado = VALUES(estado);

INSERT INTO usuario_roles (rolID, usuarioID, estado)
SELECT 1, 1, 'ACTIVO' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM usuario_roles WHERE rolID = 1 AND usuarioID = 1);
INSERT INTO usuario_roles (rolID, usuarioID, estado)
SELECT 1, 2, 'ACTIVO' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM usuario_roles WHERE rolID = 1 AND usuarioID = 2);


-- =============================================================================
-- Fin del armado
-- Login: lore@cordobanutricion.com | pao@cordobanutricion.com | Contraseña: password
-- =============================================================================
