const { BloqueosAgenda, Profesionales } = require('../models');
const { Op } = require('sequelize');

const listar = async (req, res) => {
  try {
    const { profesionalID, fechaInicio, fechaFin } = req.query;
    const where = {};

    if (profesionalID) {
      where.profesionalID = profesionalID;
    }

    if (fechaInicio || fechaFin) {
      const parseDate = (value) => {
        if (!value) return null;
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
      };
      const inicio = parseDate(fechaInicio);
      const fin = parseDate(fechaFin);
      if (fechaInicio && !inicio) {
        return res.status(400).json({ error: 'fechaInicio inválida' });
      }
      if (fechaFin && !fin) {
        return res.status(400).json({ error: 'fechaFin inválida' });
      }
      if (inicio && fin) {
        where.horaInicio = { [Op.between]: [inicio, fin] };
      } else if (inicio) {
        where.horaInicio = { [Op.gte]: inicio };
      } else if (fin) {
        where.horaInicio = { [Op.lte]: fin };
      }
    }

    const bloqueos = await BloqueosAgenda.findAll({
      where,
      include: [{ model: Profesionales, as: 'profesional', attributes: ['id', 'nombre', 'color'] }],
      order: [['horaInicio', 'ASC']]
    });
    res.json(bloqueos);
  } catch (error) {
    console.error('Error listando bloqueos agenda:', error);
    res.status(500).json({ error: 'Error al listar bloqueos de agenda' });
  }
};

const obtener = async (req, res) => {
  try {
    const { id } = req.params;
    const bloqueo = await BloqueosAgenda.findByPk(id, {
      include: [{ model: Profesionales, as: 'profesional', attributes: ['id', 'nombre', 'color'] }]
    });
    if (!bloqueo) {
      return res.status(404).json({ error: 'Bloqueo no encontrado' });
    }
    res.json(bloqueo);
  } catch (error) {
    console.error('Error obteniendo bloqueo:', error);
    res.status(500).json({ error: 'Error al obtener bloqueo' });
  }
};

const crear = async (req, res) => {
  try {
    const { profesionalID, horaInicio, horaFin } = req.body;
    if (!profesionalID || !horaInicio || !horaFin) {
      return res.status(400).json({ error: 'profesionalID, horaInicio y horaFin son requeridos' });
    }
    const profesional = await Profesionales.findByPk(profesionalID);
    if (!profesional) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }
    const bloqueo = await BloqueosAgenda.create({
      profesionalID,
      horaInicio: new Date(horaInicio),
      horaFin: new Date(horaFin)
    });
    const conProfesional = await BloqueosAgenda.findByPk(bloqueo.id, {
      include: [{ model: Profesionales, as: 'profesional', attributes: ['id', 'nombre', 'color'] }]
    });
    res.status(201).json(conProfesional);
  } catch (error) {
    console.error('Error creando bloqueo agenda:', error);
    res.status(500).json({ error: 'Error al crear bloqueo de agenda' });
  }
};

const actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { profesionalID, horaInicio, horaFin } = req.body;
    const bloqueo = await BloqueosAgenda.findByPk(id);
    if (!bloqueo) {
      return res.status(404).json({ error: 'Bloqueo no encontrado' });
    }
    const updateData = {};
    if (profesionalID) {
      const profesional = await Profesionales.findByPk(profesionalID);
      if (!profesional) return res.status(404).json({ error: 'Profesional no encontrado' });
      updateData.profesionalID = profesionalID;
    }
    if (horaInicio) updateData.horaInicio = new Date(horaInicio);
    if (horaFin) updateData.horaFin = new Date(horaFin);
    await bloqueo.update(updateData);
    const conProfesional = await BloqueosAgenda.findByPk(bloqueo.id, {
      include: [{ model: Profesionales, as: 'profesional', attributes: ['id', 'nombre', 'color'] }]
    });
    res.json(conProfesional);
  } catch (error) {
    console.error('Error actualizando bloqueo agenda:', error);
    res.status(500).json({ error: 'Error al actualizar bloqueo de agenda' });
  }
};

const eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const bloqueo = await BloqueosAgenda.findByPk(id);
    if (!bloqueo) {
      return res.status(404).json({ error: 'Bloqueo no encontrado' });
    }
    await bloqueo.destroy();
    res.json({ message: 'Bloqueo eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando bloqueo agenda:', error);
    res.status(500).json({ error: 'Error al eliminar bloqueo de agenda' });
  }
};

module.exports = { listar, obtener, crear, actualizar, eliminar };
