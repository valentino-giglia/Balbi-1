const { Files, Pacientes, Mascotas, Turnos } = require('../models');
const { paginate } = require('../utils/pagination');
const { getBucket } = require('../config/firebase');
const crypto = require('crypto');

function tipoArchivoFromMimetype(mimetype) {
  if (!mimetype) return null;
  if (/^image\//i.test(mimetype)) return 'IMAGEN';
  if (mimetype === 'application/pdf') return 'DOCUMENTO';
  return null;
}

// GET /api/files?pacienteID=&mascotaID=&turnoID=&page=&pageSize=
const listar = async (req, res) => {
  try {
    const { pacienteID, mascotaID, turnoID, page = 1, pageSize = 12 } = req.query;

    if (!pacienteID && !mascotaID && !turnoID) {
      return res.status(400).json({ error: 'pacienteID, mascotaID o turnoID es requerido' });
    }

    const where = {};
    if (mascotaID) {
      where.mascotaID = mascotaID;
    } else if (pacienteID) {
      where.pacienteID = pacienteID;
    }
    if (turnoID) where.turnoID = turnoID;

    const result = await paginate(Files, {
      where,
      order: [['createdAt', 'DESC']],
      page: parseInt(page, 10),
      pageSize: Math.min(parseInt(pageSize, 10) || 12, 50)
    });

    const bucket = getBucket();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const dataWithUrls = await Promise.all(
      result.data.map(async (file) => {
        try {
          const [signedUrl] = await bucket.file(file.storagePath).getSignedUrl({
            action: 'read',
            expires: expiresAt
          });
          return {
            id: file.id,
            pacienteID: file.pacienteID,
            mascotaID: file.mascotaID,
            turnoID: file.turnoID,
            tipoArchivo: file.tipoArchivo,
            url: signedUrl,
            nombreArchivo: file.nombreArchivo,
            createdAt: file.createdAt
          };
        } catch (err) {
          console.error('Error generando URL para file', file.id, err.message);
          return {
            id: file.id,
            pacienteID: file.pacienteID,
            mascotaID: file.mascotaID,
            turnoID: file.turnoID,
            tipoArchivo: file.tipoArchivo,
            url: null,
            nombreArchivo: file.nombreArchivo,
            createdAt: file.createdAt
          };
        }
      })
    );

    res.json({
      data: dataWithUrls,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error listando files:', error);
    res.status(500).json({ error: 'Error al listar archivos' });
  }
};

// POST /api/files (multipart: file + pacienteID [+ mascotaID] [+ turnoID])
const subir = async (req, res) => {
  try {
    const pacienteID = parseInt(req.body.pacienteID, 10);
    const mascotaID = req.body.mascotaID ? parseInt(req.body.mascotaID, 10) : null;
    const turnoID = req.body.turnoID ? parseInt(req.body.turnoID, 10) : null;
    const tipoArchivoBody = req.body.tipoArchivo || null;
    if (!pacienteID || isNaN(pacienteID)) {
      return res.status(400).json({ error: 'pacienteID es requerido' });
    }

    const paciente = await Pacientes.findByPk(pacienteID);
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    if (mascotaID) {
      const mascota = await Mascotas.findByPk(mascotaID);
      if (!mascota || mascota.pacienteID !== pacienteID) {
        return res.status(404).json({ error: 'Mascota no encontrada o no pertenece al paciente' });
      }
    }

    if (turnoID) {
      const turno = await Turnos.findByPk(turnoID);
      if (!turno) {
        return res.status(404).json({ error: 'Turno no encontrado' });
      }
      if (turno.pacienteID !== pacienteID) {
        return res.status(400).json({ error: 'El turno no pertenece al paciente' });
      }
      if (mascotaID != null && turno.mascotaID !== mascotaID) {
        return res.status(400).json({ error: 'El turno no corresponde a la mascota seleccionada' });
      }
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No se envió ningún archivo' });
    }

    const tipoArchivo = tipoArchivoBody || tipoArchivoFromMimetype(req.file.mimetype);

    const bucket = getBucket();
    const ext = (req.file.originalname && req.file.originalname.split('.').pop()) || (req.file.mimetype === 'application/pdf' ? 'pdf' : 'jpg');
    const safeName = `${crypto.randomUUID()}.${ext}`;
    let pathPrefix = mascotaID ? `pacientes/${pacienteID}/mascotas/${mascotaID}` : `pacientes/${pacienteID}`;
    if (turnoID) {
      pathPrefix += `/turno_${turnoID}`;
    }
    const storagePath = `${pathPrefix}/${safeName}`;

    const file = bucket.file(storagePath);
    await file.save(req.file.buffer, {
      metadata: { contentType: req.file.mimetype || 'image/jpeg' }
    });

    const created = await Files.create({
      storagePath,
      pacienteID,
      mascotaID: mascotaID || null,
      turnoID: turnoID || null,
      nombreArchivo: req.file.originalname || null,
      tipoArchivo
    });

    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    res.status(201).json({
      id: created.id,
      pacienteID: created.pacienteID,
      mascotaID: created.mascotaID,
      turnoID: created.turnoID,
      tipoArchivo: created.tipoArchivo,
      url: signedUrl,
      nombreArchivo: created.nombreArchivo,
      createdAt: created.createdAt
    });
  } catch (error) {
    console.error('Error subiendo file:', error);
    if (error.message && error.message.includes('Firebase no configurado')) {
      return res.status(503).json({ error: 'Storage no configurado' });
    }
    res.status(500).json({ error: 'Error al subir archivo' });
  }
};

// DELETE /api/files/:id
const eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await Files.findByPk(id);

    if (!file) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    const bucket = getBucket();
    const ref = bucket.file(file.storagePath);
    try {
      await ref.delete();
    } catch (storageErr) {
      if (storageErr.code !== 404) {
        console.error('Error eliminando de Firebase:', storageErr);
      }
    }

    await file.destroy();
    res.json({ message: 'Archivo eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando file:', error);
    if (error.message && error.message.includes('Firebase no configurado')) {
      return res.status(503).json({ error: 'Storage no configurado' });
    }
    res.status(500).json({ error: 'Error al eliminar archivo' });
  }
};

module.exports = {
  listar,
  subir,
  eliminar
};
