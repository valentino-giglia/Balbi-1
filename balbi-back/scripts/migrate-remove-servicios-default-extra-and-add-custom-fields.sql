-- =============================================================================
-- Migración: eliminar default_extra_* de servicios y asegurar tabla custom_fields
-- Ejecutar sobre la base de datos existente (cordoba_nutricion)
-- =============================================================================

USE balbi;

-- Crear tabla custom_fields si no existe (para nuevos customfields de consulta y ficha)
CREATE TABLE IF NOT EXISTS custom_fields (
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

-- Eliminar columnas legacy de estructura por defecto en servicios
ALTER TABLE servicios
  DROP COLUMN IF EXISTS default_extra_consulta,
  DROP COLUMN IF EXISTS default_extra_ficha;

-- Nota:
-- - Los datos existentes en consultas.extra y fichas.extra se mantienen.
-- - Para visualizar correctamente los datos históricos, crear customfields con las mismas keys usadas en esos JSON.

