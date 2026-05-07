-- =============================================================================
-- Script de seed - Datos iniciales Córdoba Nutrición
--
-- Usuarios: Lore (lore@cordobanutricion.com), Pao (pao@cordobanutricion.com)
-- Contraseña: password  (hash bcrypt incluido)
--
-- Servicio: Servicio nutricion de 30 minutos
-- Profesionales: Lore, Pao (vinculados a servicio)
--
-- Ejecutar DESPUÉS de create-database.sql
--   mysql -u USUARIO -p cordoba_nutricion < scripts/seed-initial-data.sql
-- =============================================================================

USE cordoba_nutricion;

-- Hash bcrypt para contraseña "password" (cost 10)
SET @pwd_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

-- -----------------------------------------------------------------------------
-- Roles
-- -----------------------------------------------------------------------------
INSERT INTO roles (id, nombre, estado) VALUES
(1, 'Administrador', 'ACTIVO')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), estado = VALUES(estado);

-- -----------------------------------------------------------------------------
-- Usuarios (Lore, Pao) - contraseña: password
-- -----------------------------------------------------------------------------
INSERT INTO usuarios (id, nombre, email, telefono, contrasena, estado) VALUES
(1, 'Lore', 'lore@cordobanutricion.com', NULL, @pwd_hash, 'ACTIVO'),
(2, 'Pao', 'pao@cordobanutricion.com', NULL, @pwd_hash, 'ACTIVO')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), contrasena = VALUES(contrasena), estado = VALUES(estado);

-- -----------------------------------------------------------------------------
-- Usuario-Rol (Administrador para ambos)
-- -----------------------------------------------------------------------------
INSERT INTO usuario_roles (rolID, usuarioID, estado)
SELECT 1, 1, 'ACTIVO' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM usuario_roles WHERE rolID = 1 AND usuarioID = 1);
INSERT INTO usuario_roles (rolID, usuarioID, estado)
SELECT 1, 2, 'ACTIVO' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM usuario_roles WHERE rolID = 1 AND usuarioID = 2);

-- -----------------------------------------------------------------------------
-- Servicio
-- -----------------------------------------------------------------------------
INSERT INTO servicios (id, nombre, codigo, duracionMinutos, estado) VALUES
(1, 'Servicio nutricion de 30 minutos', 'NUTRICION-30', 30, 'ACTIVO')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), duracionMinutos = VALUES(duracionMinutos), estado = VALUES(estado);

-- -----------------------------------------------------------------------------
-- Profesionales (Lore, Pao)
-- -----------------------------------------------------------------------------
INSERT INTO profesionales (id, nombre, codigo, telefono, email, color, estado) VALUES
(1, 'Lore', 'LORE', NULL, 'lore@cordobanutricion.com', '#1976d2', 'ACTIVO'),
(2, 'Pao', 'PAO', NULL, 'pao@cordobanutricion.com', '#1976d2', 'ACTIVO')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), email = VALUES(email), estado = VALUES(estado);

-- -----------------------------------------------------------------------------
-- Profesionales-Servicio (ambos con Servicio 30 min)
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO profesionales_servicios (profesionalID, servicioID, estado) VALUES
(1, 1, 'ACTIVO'),
(2, 1, 'ACTIVO');

-- =============================================================================
-- Fin del seed
-- Login: lore@cordobanutricion.com | pao@cordobanutricion.com
-- Contraseña: password
-- =============================================================================
