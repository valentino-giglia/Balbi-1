-- Agrega columna precio a servicios y talleres (precio por defecto en pagos)
-- Ejecutar en la base existente si ya tenés las tablas creadas.

ALTER TABLE servicios
  ADD COLUMN precio DECIMAL(10, 2) NULL DEFAULT 0
  COMMENT 'Precio por defecto para usar en pagos'
  AFTER color;

ALTER TABLE talleres
  ADD COLUMN precio DECIMAL(10, 2) NULL DEFAULT 0
  COMMENT 'Precio por defecto para usar en pagos'
  AFTER codigo;
