const { Horarios, Profesionales } = require('../models');
const { Op } = require('sequelize');

const listarHorarios = async (req, res) => {
  try {
    const { profesionalID } = req.query;
    const where = {};

    if (profesionalID) {
      where.profesionalID = profesionalID;
    }

    const horarios = await Horarios.findAll({
      where,
      include: [{
        model: Profesionales,
        as: 'profesional',
        attributes: ['id', 'nombre']
      }],
      order: [
        ['diaSemana', 'ASC'],
        ['horaInicio', 'ASC']
      ]
    });

    res.json(horarios);
  } catch (error) {
    console.error('Error listando horarios:', error);
    res.status(500).json({ error: 'Error al listar horarios' });
  }
};

const obtenerHorario = async (req, res) => {
  try {
    const { id } = req.params;
    const horario = await Horarios.findByPk(id, {
      include: [{
        model: Profesionales,
        as: 'profesional',
        attributes: ['id', 'nombre']
      }]
    });

    if (!horario) {
      return res.status(404).json({ error: 'Horario no encontrado' });
    }

    res.json(horario);
  } catch (error) {
    console.error('Error obteniendo horario:', error);
    res.status(500).json({ error: 'Error al obtener horario' });
  }
};

const crearHorario = async (req, res) => {
  try {
    const { profesionalID, diaSemana, horaInicio, horaFin } = req.body;

    if (!profesionalID || !diaSemana || !horaInicio || !horaFin) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Validar que el profesional existe
    const profesional = await Profesionales.findByPk(profesionalID);
    if (!profesional) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    const horario = await Horarios.create({
      profesionalID,
      diaSemana,
      horaInicio,
      horaFin
    });

    res.status(201).json(horario);
  } catch (error) {
    console.error('Error creando horario:', error);
    res.status(500).json({ error: 'Error al crear horario' });
  }
};

const crearHorariosMasivo = async (req, res) => {
  try {
    const { profesionalID, horarios } = req.body;

    if (!profesionalID || !Array.isArray(horarios) || horarios.length === 0) {
      return res.status(400).json({ error: 'profesionalID y array de horarios son requeridos' });
    }

    // Validar que el profesional existe
    const profesional = await Profesionales.findByPk(profesionalID);
    if (!profesional) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    // Eliminar horarios existentes del profesional
    await Horarios.destroy({
      where: { profesionalID }
    });

    // Crear nuevos horarios
    const horariosCreados = await Horarios.bulkCreate(
      horarios.map(h => ({
        profesionalID,
        diaSemana: h.diaSemana,
        horaInicio: h.horaInicio,
        horaFin: h.horaFin
      }))
    );

    res.status(201).json(horariosCreados);
  } catch (error) {
    console.error('Error creando horarios masivo:', error);
    res.status(500).json({ error: 'Error al crear horarios' });
  }
};

const actualizarHorario = async (req, res) => {
  try {
    const { id } = req.params;
    const { diaSemana, horaInicio, horaFin } = req.body;

    const horario = await Horarios.findByPk(id);
    if (!horario) {
      return res.status(404).json({ error: 'Horario no encontrado' });
    }

    const updateData = {};
    if (diaSemana) updateData.diaSemana = diaSemana;
    if (horaInicio) updateData.horaInicio = horaInicio;
    if (horaFin) updateData.horaFin = horaFin;

    await horario.update(updateData);
    res.json(horario);
  } catch (error) {
    console.error('Error actualizando horario:', error);
    res.status(500).json({ error: 'Error al actualizar horario' });
  }
};

const eliminarHorario = async (req, res) => {
  try {
    const { id } = req.params;
    const horario = await Horarios.findByPk(id);

    if (!horario) {
      return res.status(404).json({ error: 'Horario no encontrado' });
    }

    await horario.destroy();
    res.json({ message: 'Horario eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando horario:', error);
    res.status(500).json({ error: 'Error al eliminar horario' });
  }
};

const eliminarHorariosPorProfesional = async (req, res) => {
  try {
    const { profesionalID } = req.params;

    await Horarios.destroy({
      where: { profesionalID }
    });

    res.json({ message: 'Horarios eliminados correctamente' });
  } catch (error) {
    console.error('Error eliminando horarios:', error);
    res.status(500).json({ error: 'Error al eliminar horarios' });
  }
};

module.exports = {
  listarHorarios,
  obtenerHorario,
  crearHorario,
  crearHorariosMasivo,
  actualizarHorario,
  eliminarHorario,
  eliminarHorariosPorProfesional
};
