const { Pacientes, Turnos, Servicios, Consultas, Fichas, Profesionales, Files } = require('../models');
const { Op } = require('sequelize');
const { paginate } = require('../utils/pagination');

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

const listarPacientes = async (req, res) => {
  try {
    const { estado, nombre, dni, page = 1, pageSize = 10 } = req.query;
    const where = {};

    if (estado) {
      where.estado = estado;
    }
    if (nombre) {
      where.nombre = { [Op.like]: `%${nombre}%` };
    }
    if (dni) {
      where.dni = { [Op.like]: `%${dni}%` };
    }

    const result = await paginate(Pacientes, {
      where,
      order: [['nombre', 'ASC']],
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10)
    });

    res.json(result);
  } catch (error) {
    console.error('Error listando pacientes:', error);
    res.status(500).json({ error: 'Error al listar pacientes' });
  }
};

const obtenerPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const paciente = await Pacientes.findByPk(id);

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    res.json(paciente);
  } catch (error) {
    console.error('Error obteniendo paciente:', error);
    res.status(500).json({ error: 'Error al obtener paciente' });
  }
};

function normalizarStr(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

const crearPaciente = async (req, res) => {
  try {
    const { nombre, telefono, email, dni, domicilio, kapso_phone_number_id, kapso_conversation_id, kapso_agent_status } = req.body;

    const nombreTrim = normalizarStr(nombre);
    if (!nombreTrim) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const dniNorm = normalizarStr(dni);
    const telefonoNorm = normalizarStr(telefono);
    const emailNorm = normalizarStr(email);
    const domicilioNorm = normalizarStr(domicilio);

    if (dniNorm) {
      const pacienteExistente = await Pacientes.findOne({ where: { dni: dniNorm } });
      if (pacienteExistente) return res.status(400).json({ error: 'Ya existe un cliente con ese DNI' });
    }
    if (emailNorm) {
      const pacienteExistente = await Pacientes.findOne({ where: { email: emailNorm } });
      if (pacienteExistente) return res.status(400).json({ error: 'Ya existe un cliente con ese email' });
    }
    if (telefonoNorm) {
      const pacienteExistente = await Pacientes.findOne({ where: { telefono: telefonoNorm } });
      if (pacienteExistente) return res.status(400).json({ error: 'Ya existe un cliente con ese teléfono' });
    }

    const paciente = await Pacientes.create({
      nombre: nombreTrim,
      telefono: telefonoNorm,
      email: emailNorm,
      dni: dniNorm,
      domicilio: domicilioNorm,
      kapso_phone_number_id,
      kapso_conversation_id,
      kapso_agent_status: kapso_agent_status || 'OFF',
      estado: 'ACTIVO'
    });

    res.status(201).json(paciente);
  } catch (error) {
    console.error('Error creando paciente:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Ya existe un paciente con ese teléfono' });
    }
    res.status(500).json({ error: 'Error al crear paciente' });
  }
};

const actualizarPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, telefono, email, dni, domicilio, kapso_phone_number_id, kapso_conversation_id, kapso_agent_status, estado, sn_derivado } = req.body;

    const paciente = await Pacientes.findByPk(id);
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    const dniNorm = dni !== undefined ? normalizarStr(dni) : undefined;
    if (dniNorm !== undefined && dniNorm && dniNorm !== paciente.dni) {
      const pacienteExistente = await Pacientes.findOne({ where: { dni: dniNorm } });
      if (pacienteExistente) return res.status(400).json({ error: 'Ya existe un cliente con ese DNI' });
    }
    const emailNormUpd = email !== undefined ? normalizarStr(email) : undefined;
    if (emailNormUpd !== undefined && emailNormUpd && emailNormUpd !== paciente.email) {
      const pacienteExistente = await Pacientes.findOne({ where: { email: emailNormUpd } });
      if (pacienteExistente) return res.status(400).json({ error: 'Ya existe un cliente con ese email' });
    }
    const telefonoNormUpd = telefono !== undefined ? normalizarStr(telefono) : undefined;
    if (telefonoNormUpd !== undefined && telefonoNormUpd && telefonoNormUpd !== paciente.telefono) {
      const pacienteExistente = await Pacientes.findOne({ where: { telefono: telefonoNormUpd } });
      if (pacienteExistente) return res.status(400).json({ error: 'Ya existe un cliente con ese teléfono' });
    }

    const updateData = {};
    if (nombre !== undefined) {
      const nombreTrim = normalizarStr(nombre);
      if (!nombreTrim) {
        return res.status(400).json({ error: 'El nombre es requerido' });
      }
      updateData.nombre = nombreTrim;
    }
    if (telefono !== undefined) updateData.telefono = normalizarStr(telefono);
    if (email !== undefined) updateData.email = normalizarStr(email);
    if (dniNorm !== undefined) updateData.dni = dniNorm;
    if (domicilio !== undefined) updateData.domicilio = normalizarStr(domicilio);
    if (kapso_phone_number_id !== undefined) updateData.kapso_phone_number_id = kapso_phone_number_id;
    if (kapso_conversation_id !== undefined) updateData.kapso_conversation_id = kapso_conversation_id;
    if (kapso_agent_status !== undefined) updateData.kapso_agent_status = kapso_agent_status;
    if (estado) updateData.estado = estado;
    if (sn_derivado !== undefined) updateData.sn_derivado = !!sn_derivado;

    await paciente.update(updateData);
    res.json(paciente);
  } catch (error) {
    console.error('Error actualizando paciente:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Ya existe un paciente con ese teléfono' });
    }
    res.status(500).json({ error: 'Error al actualizar paciente' });
  }
};

const eliminarPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const paciente = await Pacientes.findByPk(id);

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    await paciente.update({ estado: 'BAJA' });
    res.json({ message: 'Paciente eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando paciente:', error);
    res.status(500).json({ error: 'Error al eliminar paciente' });
  }
};

const upsertPaciente = async (req, res) => {
  try {
    const { nombre, telefono, email, dni, kapso_phone_number_id, kapso_conversation_id, kapso_agent_status } = req.body;

    if (!telefono) {
      return res.status(400).json({ error: 'El teléfono es requerido' });
    }


    const [paciente, created] = await Pacientes.findOrCreate({
      where: { telefono },
      defaults: {
        nombre,
        telefono,
        email,
        dni,
        kapso_phone_number_id,
        kapso_conversation_id,
        kapso_agent_status: kapso_agent_status || 'ON',
        estado: 'ACTIVO'
      }
    });

    if (!created) {
      const updateData = {};
      if (nombre) updateData.nombre = nombre;
      if (email !== undefined) updateData.email = email;
      if (dni !== undefined) updateData.dni = dni;
      if (kapso_phone_number_id !== undefined) updateData.kapso_phone_number_id = kapso_phone_number_id;
      if (kapso_conversation_id !== undefined) updateData.kapso_conversation_id = kapso_conversation_id;
      if (kapso_agent_status !== undefined) updateData.kapso_agent_status = kapso_agent_status;
      if (paciente.estado === 'BAJA') updateData.estado = 'ACTIVO';

      await paciente.update(updateData);
    }

    res.json(paciente);
  } catch (error) {
    console.error('Error en upsert de paciente:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Ya existe un paciente con ese teléfono' });
    }
    res.status(500).json({ error: 'Error al crear/actualizar paciente' });
  }
};

const obtenerHistorialPaciente = async (req, res) => {
  try {
    const { id } = req.params;

    const paciente = await Pacientes.findByPk(id);
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    // Turnos del paciente (por pacienteID en turnos) ordenados por fecha descendente
    const turnos = await Turnos.findAll({
      where: { pacienteID: id },
      include: [
        { model: Servicios, as: 'servicio' },
        { model: Profesionales, as: 'profesional' }
      ],
      order: [['horaInicio', 'DESC']]
    });

    // Misma forma que antes para compatibilidad con el front: cada ítem con .turno
    const turnosFormato = turnos.map(t => ({
      id: t.id,
      turnoID: t.id,
      pacienteID: t.pacienteID,
      estado: t.estado,
      notas: t.notas,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      turno: t
    }));

    res.json({
      paciente,
      turnos: turnosFormato
    });
  } catch (error) {
    console.error('Error obteniendo historial del paciente:', error);
    res.status(500).json({ error: 'Error al obtener historial del paciente' });
  }
};

/** Resumen para PDF de historial clínico: paciente, ficha y turnos con consultas */
const obtenerResumenHistorialClinico = async (req, res) => {
  try {
    const { id } = req.params;
    const paciente = await Pacientes.findByPk(id, {
      attributes: ['id', 'nombre', 'dni', 'telefono', 'email']
    });
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    const [ficha] = await Fichas.findAll({
      where: { pacienteID: id },
      order: [['createdAt', 'DESC']],
      limit: 1,
      attributes: ['id', 'notas', 'extra', 'createdAt']
    });

    const turnos = await Turnos.findAll({
      where: { pacienteID: id },
      include: [
        { model: Servicios, as: 'servicio', attributes: ['id', 'nombre'] },
        { model: Profesionales, as: 'profesional', attributes: ['id', 'nombre'] },
        { model: Consultas, as: 'consulta', attributes: CONSULTA_HISTORIAL_ATTR, required: false }
      ],
      order: [['horaInicio', 'DESC']]
    });

    const files = await Files.findAll({
      where: { pacienteID: id },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'nombreArchivo', 'tipoArchivo', 'turnoID', 'mascotaID', 'createdAt']
    });

    res.json({
      paciente: paciente.toJSON(),
      ficha: ficha ? ficha.toJSON() : null,
      turnos: turnos.map(t => {
        const j = t.toJSON();
        return {
          id: j.id,
          horaInicio: j.horaInicio,
          estado: j.estado,
          duracionMinutos: j.duracionMinutos,
          notas: j.notas,
          servicio: j.servicio,
          profesional: j.profesional,
          consulta: j.consulta
        };
      }),
      filesCount: files.length,
      files: files.map(f => f.toJSON())
    });
  } catch (error) {
    console.error('Error obteniendo resumen historial clínico:', error);
    res.status(500).json({ error: 'Error al obtener resumen de historial clínico' });
  }
};

module.exports = {
  listarPacientes,
  obtenerPaciente,
  crearPaciente,
  actualizarPaciente,
  eliminarPaciente,
  upsertPaciente,
  obtenerHistorialPaciente,
  obtenerResumenHistorialClinico
};

