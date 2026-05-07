const {
  Mascotas,
  Pacientes,
  MascotaPaciente,
  Fichas,
  Turnos,
  Servicios,
  Profesionales,
  Consultas,
  Files,
  Vacunas
} = require('../models');

const CONSULTA_HISTORIAL_ATTR = [
  'id',
  'nota',
  'extra',
  'createdAt',
  'motivoConsulta',
  'examenClinico',
  'diagnostico',
  'planTratamiento',
  'pesoKg'
];
const { Op } = require('sequelize');
const { paginate } = require('../utils/pagination');

const includeMascotaBase = [
  { model: Pacientes, as: 'paciente', attributes: ['id', 'nombre'] },
  { model: Pacientes, as: 'coTutores', attributes: ['id', 'nombre'], through: { attributes: [] } }
];

const listar = async (req, res) => {
  try {
    const { pacienteID, estado, page = 1, pageSize = 50 } = req.query;
    const where = {};

    if (pacienteID) {
      const pid = parseInt(pacienteID, 10);
      const links = await MascotaPaciente.findAll({
        where: { pacienteID: pid },
        attributes: ['mascotaID']
      });
      const sharedIds = links.map((l) => l.mascotaID);
      const orClause = [{ pacienteID: pid }];
      if (sharedIds.length) {
        orClause.push({ id: { [Op.in]: sharedIds } });
      }
      where[Op.or] = orClause;
    }
    if (estado) {
      where.estado = estado;
    }

    const result = await paginate(Mascotas, {
      where,
      include: includeMascotaBase,
      order: [['nombre', 'ASC']],
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      distinct: true
    });
    res.json(result);
  } catch (error) {
    console.error('Error listando mascotas:', error);
    res.status(500).json({ error: 'Error al listar mascotas' });
  }
};

const obtener = async (req, res) => {
  try {
    const { id } = req.params;
    const mascota = await Mascotas.findByPk(id, {
      include: [
        { model: Pacientes, as: 'paciente', attributes: ['id', 'nombre', 'telefono', 'email'] },
        { model: Pacientes, as: 'coTutores', attributes: ['id', 'nombre'], through: { attributes: [] } }
      ]
    });
    if (!mascota) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }
    res.json(mascota);
  } catch (error) {
    console.error('Error obteniendo mascota:', error);
    res.status(500).json({ error: 'Error al obtener mascota' });
  }
};

const crear = async (req, res) => {
  try {
    const { pacienteID, nombre, especie, raza, fechaNacimiento, notas, estado } = req.body;
    if (!pacienteID || !nombre) {
      return res.status(400).json({ error: 'pacienteID y nombre son requeridos' });
    }
    const paciente = await Pacientes.findByPk(pacienteID);
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    const mascota = await Mascotas.create({
      pacienteID,
      nombre,
      especie: especie || null,
      raza: raza || null,
      fechaNacimiento: fechaNacimiento || null,
      notas: notas || null,
      estado: estado || 'ACTIVO'
    });
    const conPaciente = await Mascotas.findByPk(mascota.id, {
      include: includeMascotaBase
    });
    res.status(201).json(conPaciente);
  } catch (error) {
    console.error('Error creando mascota:', error);
    res.status(500).json({ error: 'Error al crear mascota' });
  }
};

const actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { pacienteID, nombre, especie, raza, fechaNacimiento, notas, estado } = req.body;
    const mascota = await Mascotas.findByPk(id);
    if (!mascota) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }
    if (pacienteID) {
      const paciente = await Pacientes.findByPk(pacienteID);
      if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    const titularAnterior = mascota.pacienteID;
    const updateData = {};
    if (pacienteID !== undefined) updateData.pacienteID = pacienteID;
    if (nombre !== undefined) updateData.nombre = nombre;
    if (especie !== undefined) updateData.especie = especie;
    if (raza !== undefined) updateData.raza = raza;
    if (fechaNacimiento !== undefined) updateData.fechaNacimiento = fechaNacimiento;
    if (notas !== undefined) updateData.notas = notas;
    if (estado !== undefined) updateData.estado = estado;
    await mascota.update(updateData);
    if (pacienteID !== undefined && pacienteID != null && pacienteID !== titularAnterior) {
      await MascotaPaciente.destroy({
        where: { mascotaID: mascota.id, pacienteID }
      });
    }
    const conPaciente = await Mascotas.findByPk(mascota.id, {
      include: includeMascotaBase
    });
    res.json(conPaciente);
  } catch (error) {
    console.error('Error actualizando mascota:', error);
    res.status(500).json({ error: 'Error al actualizar mascota' });
  }
};

const eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const mascota = await Mascotas.findByPk(id);
    if (!mascota) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }
    await mascota.update({ estado: 'BAJA' });
    res.json({ message: 'Mascota eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando mascota:', error);
    res.status(500).json({ error: 'Error al eliminar mascota' });
  }
};

/** GET /api/mascotas/:id/historial-clinico - Resumen HC por mascota (ficha, turnos con consultas, files) */
const obtenerHistorialClinico = async (req, res) => {
  try {
    const { id } = req.params;

    const mascota = await Mascotas.findByPk(id, {
      include: [
        { model: Pacientes, as: 'paciente', attributes: ['id', 'nombre', 'dni', 'telefono', 'email'] },
        { model: Pacientes, as: 'coTutores', attributes: ['id', 'nombre'], through: { attributes: [] } }
      ]
    });
    if (!mascota) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }

    const [ficha] = await Fichas.findAll({
      where: { mascotaID: id },
      order: [['createdAt', 'DESC']],
      limit: 1,
      attributes: ['id', 'notas', 'extra', 'createdAt']
    });

    const turnos = await Turnos.findAll({
      where: { mascotaID: id },
      include: [
        { model: Servicios, as: 'servicio', attributes: ['id', 'nombre'] },
        { model: Profesionales, as: 'profesional', attributes: ['id', 'nombre'] },
        { model: Consultas, as: 'consulta', attributes: CONSULTA_HISTORIAL_ATTR, required: false }
      ],
      order: [['horaInicio', 'DESC']]
    });

    const [filesCount, vacunas, files] = await Promise.all([
      Files.count({ where: { mascotaID: id } }),
      Vacunas.findAll({
        where: { mascotaID: id },
        order: [['fechaAplicacion', 'DESC']],
        attributes: ['id', 'nombre', 'fechaAplicacion', 'proximaDosis', 'notas']
      }),
      Files.findAll({
        where: { mascotaID: id },
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'nombreArchivo', 'tipoArchivo', 'turnoID', 'createdAt']
      })
    ]);

    res.json({
      mascota: mascota.toJSON(),
      ficha: ficha ? ficha.toJSON() : null,
      turnos: turnos.map(t => {
        const j = t.toJSON();
        return {
          id: j.id,
          horaInicio: j.horaInicio,
          estado: j.estado,
          duracionMinutos: j.duracionMinutos,
          notas: j.notas,
          tipo: j.tipo,
          servicio: j.servicio,
          profesional: j.profesional,
          consulta: j.consulta
        };
      }),
      filesCount,
      vacunas: vacunas.map(v => v.toJSON()),
      files: files.map(f => f.toJSON())
    });
  } catch (error) {
    console.error('Error obteniendo historial clínico de mascota:', error);
    res.status(500).json({ error: 'Error al obtener historial clínico de la mascota' });
  }
};

const agregarCoTutor = async (req, res) => {
  try {
    const { id } = req.params;
    const { pacienteID } = req.body;
    if (!pacienteID) {
      return res.status(400).json({ error: 'pacienteID es requerido' });
    }
    const pid = parseInt(pacienteID, 10);
    const mascota = await Mascotas.findByPk(id);
    if (!mascota) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }
    if (pid === mascota.pacienteID) {
      return res.status(400).json({ error: 'El tutor principal no puede agregarse como co-tutor' });
    }
    const paciente = await Pacientes.findByPk(pid);
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    const existente = await MascotaPaciente.findOne({
      where: { mascotaID: mascota.id, pacienteID: pid }
    });
    if (existente) {
      return res.status(400).json({ error: 'Este paciente ya es co-tutor de la mascota' });
    }
    await MascotaPaciente.create({ mascotaID: mascota.id, pacienteID: pid });
    const actualizada = await Mascotas.findByPk(mascota.id, {
      include: includeMascotaBase
    });
    res.status(201).json(actualizada);
  } catch (error) {
    console.error('Error agregando co-tutor:', error);
    res.status(500).json({ error: 'Error al agregar co-tutor' });
  }
};

const quitarCoTutor = async (req, res) => {
  try {
    const { id, pacienteID } = req.params;
    const pid = parseInt(pacienteID, 10);
    const mascota = await Mascotas.findByPk(id);
    if (!mascota) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }
    const deleted = await MascotaPaciente.destroy({
      where: { mascotaID: mascota.id, pacienteID: pid }
    });
    if (!deleted) {
      return res.status(404).json({ error: 'No existe vínculo de co-tutor para este paciente' });
    }
    const actualizada = await Mascotas.findByPk(mascota.id, {
      include: includeMascotaBase
    });
    res.json(actualizada);
  } catch (error) {
    console.error('Error quitando co-tutor:', error);
    res.status(500).json({ error: 'Error al quitar co-tutor' });
  }
};

module.exports = {
  listar,
  obtener,
  crear,
  actualizar,
  eliminar,
  obtenerHistorialClinico,
  agregarCoTutor,
  quitarCoTutor
};
