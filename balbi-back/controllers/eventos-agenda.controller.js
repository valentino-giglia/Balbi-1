const { EventosAgenda, Profesionales } = require('../models');
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

    const eventos = await EventosAgenda.findAll({
      where,
      include: [{ model: Profesionales, as: 'profesional', attributes: ['id', 'nombre', 'color'] }],
      order: [['horaInicio', 'ASC']]
    });
    res.json(eventos);
  } catch (error) {
    console.error('Error listando eventos agenda:', error);
    res.status(500).json({ error: 'Error al listar eventos de agenda' });
  }
};

const obtener = async (req, res) => {
  try {
    const { id } = req.params;
    const evento = await EventosAgenda.findByPk(id, {
      include: [{ model: Profesionales, as: 'profesional', attributes: ['id', 'nombre', 'color'] }]
    });
    if (!evento) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    res.json(evento);
  } catch (error) {
    console.error('Error obteniendo evento:', error);
    res.status(500).json({ error: 'Error al obtener evento' });
  }
};

const crear = async (req, res) => {
  try {
    const { tipo, profesionalID, horaInicio, horaFin, notas } = req.body;
    if (!tipo || !profesionalID || !horaInicio || !horaFin) {
      return res.status(400).json({ error: 'tipo, profesionalID, horaInicio y horaFin son requeridos' });
    }
    const tiposValidos = ['TRASLADO', 'ENVIO_MUESTRAS', 'CADETERIA'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ error: 'tipo debe ser TRASLADO, ENVIO_MUESTRAS o CADETERIA' });
    }
    const profesional = await Profesionales.findByPk(profesionalID);
    if (!profesional) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }
    const evento = await EventosAgenda.create({
      tipo,
      profesionalID,
      horaInicio: new Date(horaInicio),
      horaFin: new Date(horaFin),
      notas: notas || null
    });
    const conProfesional = await EventosAgenda.findByPk(evento.id, {
      include: [{ model: Profesionales, as: 'profesional', attributes: ['id', 'nombre', 'color'] }]
    });
    res.status(201).json(conProfesional);
  } catch (error) {
    console.error('Error creando evento agenda:', error);
    res.status(500).json({ error: 'Error al crear evento de agenda' });
  }
};

const actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, profesionalID, horaInicio, horaFin, notas } = req.body;
    const evento = await EventosAgenda.findByPk(id);
    if (!evento) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    const updateData = {};
    if (tipo) {
      const tiposValidos = ['TRASLADO', 'ENVIO_MUESTRAS', 'CADETERIA'];
      if (!tiposValidos.includes(tipo)) {
        return res.status(400).json({ error: 'tipo debe ser TRASLADO, ENVIO_MUESTRAS o CADETERIA' });
      }
      updateData.tipo = tipo;
    }
    if (profesionalID) {
      const profesional = await Profesionales.findByPk(profesionalID);
      if (!profesional) return res.status(404).json({ error: 'Profesional no encontrado' });
      updateData.profesionalID = profesionalID;
    }
    if (horaInicio) updateData.horaInicio = new Date(horaInicio);
    if (horaFin) updateData.horaFin = new Date(horaFin);
    if (notas !== undefined) updateData.notas = notas;
    await evento.update(updateData);
    const conProfesional = await EventosAgenda.findByPk(evento.id, {
      include: [{ model: Profesionales, as: 'profesional', attributes: ['id', 'nombre', 'color'] }]
    });
    res.json(conProfesional);
  } catch (error) {
    console.error('Error actualizando evento agenda:', error);
    res.status(500).json({ error: 'Error al actualizar evento de agenda' });
  }
};

const eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const evento = await EventosAgenda.findByPk(id);
    if (!evento) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    await evento.destroy();
    res.json({ message: 'Evento eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando evento agenda:', error);
    res.status(500).json({ error: 'Error al eliminar evento de agenda' });
  }
};

module.exports = { listar, obtener, crear, actualizar, eliminar };
