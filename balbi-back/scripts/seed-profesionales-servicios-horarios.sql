-- =============================================================================
-- Seed: Profesionales, Servicios, Horarios (desde CSV)
-- Carlos Balbi ya existe con id 1. Resto de profesionales se insertan por codigo.
-- Horarios: solo se insertan slots parseables (formato L15/21 = Lunes 15:00-21:00).
-- Textos como "A CONSULTAR" o "LUNES A VIERNES..." no generan filas en horarios.
--
-- Ejecutar: mysql -u USUARIO -p balbi < scripts/seed-profesionales-servicios-horarios.sql
-- =============================================================================

USE balbi;

-- -----------------------------------------------------------------------------
-- 1. Profesionales (Carlos Balbi = id 1 ya existe; insertar el resto)
-- -----------------------------------------------------------------------------
INSERT INTO profesionales (nombre, codigo, estado) VALUES
('Carolina Del Buono', 'CAROLINA_DEL_BUONO', 'ACTIVO'),
('Victoria Cañete', 'VICTORIA_CANETE', 'ACTIVO'),
('Matias Zapata', 'MATIAS_ZAPATA', 'ACTIVO'),
('Pamela', 'PAMELA', 'ACTIVO')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), estado = VALUES(estado);

-- -----------------------------------------------------------------------------
-- 2. Servicios (insertar únicos por nombre/codigo)
-- -----------------------------------------------------------------------------
INSERT INTO servicios (nombre, codigo, duracionMinutos, estado) VALUES
('Clinica (Consulta)', 'CLINICA_CONSULTA', 30, 'ACTIVO'),
('Clinica (Control)', 'CLINICA_CONTROL', 30, 'ACTIVO'),
('Cirugia', 'CIRUGIA', 30, 'ACTIVO'),
('Fisiatria', 'FISIATRIA', 30, 'ACTIVO'),
('Domicilio (Consulta)', 'DOMICILIO_CONSULTA', 30, 'ACTIVO'),
('Domicilio (Control)', 'DOMICILIO_CONTROL', 30, 'ACTIVO'),
('Clinica Animales Exoticos (Consulta O Control)', 'CLINICA_ANIMALES_EXOTICOS', 30, 'ACTIVO'),
('Radiografia', 'RADIOGRAFIA', 30, 'ACTIVO'),
('Ecografia Abdominal / Toracica', 'ECOGRAFIA_ABDOMINAL_TORACICA', 30, 'ACTIVO'),
('Vacunacion', 'VACUNACION', 30, 'ACTIVO'),
('Cardiologia', 'CARDIOLOGIA', 30, 'ACTIVO'),
('Peluqueria Canina/Felina (Baño)', 'PELUQUERIA_BANO', 30, 'ACTIVO'),
('Peluqueria Caninca/Felina (Baño Y Corte)', 'PELUQUERIA_BANO_Y_CORTE', 60, 'ACTIVO')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), duracionMinutos = VALUES(duracionMinutos), estado = VALUES(estado);

-- -----------------------------------------------------------------------------
-- 3. Profesionales-Servicios (vínculos N:M)
-- Carlos balbi = id 1
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO profesionales_servicios (profesionalID, servicioID, estado)
SELECT 1, id, 'ACTIVO' FROM servicios WHERE codigo IN (
  'CLINICA_CONSULTA', 'CLINICA_CONTROL', 'CIRUGIA', 'FISIATRIA',
  'DOMICILIO_CONSULTA', 'DOMICILIO_CONTROL', 'CLINICA_ANIMALES_EXOTICOS',
  'RADIOGRAFIA', 'ECOGRAFIA_ABDOMINAL_TORACICA', 'VACUNACION'
);

INSERT IGNORE INTO profesionales_servicios (profesionalID, servicioID, estado)
SELECT p.id, s.id, 'ACTIVO'
FROM profesionales p
CROSS JOIN servicios s
WHERE p.codigo = 'CAROLINA_DEL_BUONO' AND s.codigo IN (
  'DOMICILIO_CONSULTA', 'DOMICILIO_CONTROL', 'RADIOGRAFIA', 'VACUNACION',
  'FISIATRIA', 'ECOGRAFIA_ABDOMINAL_TORACICA', 'CLINICA_CONSULTA', 'CLINICA_CONTROL'
);

INSERT IGNORE INTO profesionales_servicios (profesionalID, servicioID, estado)
SELECT p.id, s.id, 'ACTIVO'
FROM profesionales p
CROSS JOIN servicios s
WHERE p.codigo = 'VICTORIA_CANETE' AND s.codigo IN (
  'DOMICILIO_CONSULTA', 'DOMICILIO_CONTROL', 'VACUNACION', 'FISIATRIA',
  'CLINICA_CONSULTA', 'RADIOGRAFIA', 'ECOGRAFIA_ABDOMINAL_TORACICA'
);
-- Nota: CSV dice "Clinica (Consulta O Control)" -> mapeado a CLINICA_CONSULTA (un solo servicio clínica)

INSERT IGNORE INTO profesionales_servicios (profesionalID, servicioID, estado)
SELECT p.id, s.id, 'ACTIVO'
FROM profesionales p
CROSS JOIN servicios s
WHERE p.codigo = 'VICTORIA_CANETE' AND s.codigo = 'CLINICA_CONTROL';

INSERT IGNORE INTO profesionales_servicios (profesionalID, servicioID, estado)
SELECT p.id, s.id, 'ACTIVO'
FROM profesionales p
CROSS JOIN servicios s
WHERE p.codigo = 'MATIAS_ZAPATA' AND s.codigo = 'CARDIOLOGIA';

INSERT IGNORE INTO profesionales_servicios (profesionalID, servicioID, estado)
SELECT p.id, s.id, 'ACTIVO'
FROM profesionales p
CROSS JOIN servicios s
WHERE p.codigo = 'PAMELA' AND s.codigo IN ('PELUQUERIA_BANO', 'PELUQUERIA_BANO_Y_CORTE');

-- -----------------------------------------------------------------------------
-- 4. Horarios (por profesional: diaSemana, horaInicio, horaFin)
-- Solo slots parseables. "A CONSULTAR" y textos libres no generan filas.
-- diaSemana: Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo
-- -----------------------------------------------------------------------------

-- Carlos Balbi (id 1): L15/21, M9/15, M15/21, J15/21, V9/15
INSERT INTO horarios (profesionalID, diaSemana, horaInicio, horaFin)
SELECT 1, d.dia, d.hi, d.hf FROM (
  SELECT 'Lunes'   AS dia, '15:00:00' AS hi, '21:00:00' AS hf UNION ALL
  SELECT 'Martes', '09:00:00', '15:00:00' UNION ALL
  SELECT 'Martes', '15:00:00', '21:00:00' UNION ALL
  SELECT 'Jueves', '15:00:00', '21:00:00' UNION ALL
  SELECT 'Viernes','09:00:00', '15:00:00'
) d
WHERE NOT EXISTS (
  SELECT 1 FROM horarios h
  WHERE h.profesionalID = 1 AND h.diaSemana = d.dia AND h.horaInicio = d.hi AND h.horaFin = d.hf
);

-- Carolina Del Buono: L9/15, Mi9/15, J9/15, S9/21
INSERT INTO horarios (profesionalID, diaSemana, horaInicio, horaFin)
SELECT p.id, d.dia, d.hi, d.hf
FROM profesionales p
CROSS JOIN (
  SELECT 'Lunes'     AS dia, '09:00:00' AS hi, '15:00:00' AS hf UNION ALL
  SELECT 'Miércoles', '09:00:00', '15:00:00' UNION ALL
  SELECT 'Jueves',   '09:00:00', '15:00:00' UNION ALL
  SELECT 'Sábado',   '09:00:00', '21:00:00'
) d
WHERE p.codigo = 'CAROLINA_DEL_BUONO'
AND NOT EXISTS (
  SELECT 1 FROM horarios h
  WHERE h.profesionalID = p.id AND h.diaSemana = d.dia AND h.horaInicio = d.hi AND h.horaFin = d.hf
);

-- Victoria Cañete: M15/21, V9/21, D9/21
INSERT INTO horarios (profesionalID, diaSemana, horaInicio, horaFin)
SELECT p.id, d.dia, d.hi, d.hf
FROM profesionales p
CROSS JOIN (
  SELECT 'Martes'  AS dia, '15:00:00' AS hi, '21:00:00' AS hf UNION ALL
  SELECT 'Viernes', '09:00:00', '21:00:00' UNION ALL
  SELECT 'Domingo', '09:00:00', '21:00:00'
) d
WHERE p.codigo = 'VICTORIA_CANETE'
AND NOT EXISTS (
  SELECT 1 FROM horarios h
  WHERE h.profesionalID = p.id AND h.diaSemana = d.dia AND h.horaInicio = d.hi AND h.horaFin = d.hf
);

-- Matías Zapata: "MIERCOLES A LAS 19HS" -> Miércoles 19:00-20:00 (placeholder)
INSERT INTO horarios (profesionalID, diaSemana, horaInicio, horaFin)
SELECT p.id, 'Miércoles', '19:00:00', '20:00:00'
FROM profesionales p
WHERE p.codigo = 'MATIAS_ZAPATA'
AND NOT EXISTS (
  SELECT 1 FROM horarios h
  WHERE h.profesionalID = p.id AND h.diaSemana = 'Miércoles' AND h.horaInicio = '19:00:00'
);

-- Pamela: "LUNES A VIERNES A PARTIR DE LAS 15 HS" -> Lun-Vie 15:00-21:00 (placeholder)
INSERT INTO horarios (profesionalID, diaSemana, horaInicio, horaFin)
SELECT p.id, d.dia, '15:00:00', '21:00:00'
FROM profesionales p
CROSS JOIN (
  SELECT 'Lunes' AS dia UNION ALL SELECT 'Martes' UNION ALL SELECT 'Miércoles'
  UNION ALL SELECT 'Jueves' UNION ALL SELECT 'Viernes'
) d
WHERE p.codigo = 'PAMELA'
AND NOT EXISTS (
  SELECT 1 FROM horarios h
  WHERE h.profesionalID = p.id AND h.diaSemana = d.dia AND h.horaInicio = '15:00:00' AND h.horaFin = '21:00:00'
);

-- =============================================================================
-- Fin. Los horarios "A CONSULTAR" y descripciones largas no tienen fila en
-- la tabla horarios (es solo por profesional, no por servicio).
-- =============================================================================
