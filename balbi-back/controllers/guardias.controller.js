const { Guardias, Profesionales } = require('../models');
const { Op } = require('sequelize');

const listarGuardias = async (req, res) => {
  try {
    const guardias = await Guardias.findAll({
      where: { estado: { [Op.ne]: 'BAJA' } },
      include: [
        {
          model: Profesionales,
          as: 'profesional',
          attributes: ['id', 'nombre', 'color']
        }
      ],
      order: [['fecha', 'ASC']]
    });
    res.json(guardias);
  } catch (e) {
    res.status(500).json({ error: 'Error al listar guardias' });
  }
};

const crearGuardia = async (req, res) => {
  try {
    const { profesionalID, tipo, fecha, desde, hasta, activa } = req.body;

    if (activa) {
      await Guardias.update({ activa: false }, { where: {} });
    }

    const guardia = await Guardias.create({
      profesionalID,
      tipo,
      fecha,
      desde,
      hasta,
      activa: activa || false
    });

    res.status(201).json(guardia);
  } catch (e) {
    res.status(500).json({ error: 'Error al crear guardia' });
  }
};

const actualizarGuardia = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (data.activa) {
      await Guardias.update({ activa: false }, { where: { id: { [Op.ne]: id } } });
    }

    const [updated] = await Guardias.update(data, { where: { id } });

    if (!updated) {
      return res.status(404).json({ error: 'Guardia no encontrada' });
    }

    const guardia = await Guardias.findByPk(id);
    res.json(guardia);
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar guardia' });
  }
};

const eliminarGuardia = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Guardias.update({ estado: 'BAJA' }, { where: { id } });

    if (!updated) {
      return res.status(404).json({ error: 'Guardia no encontrada' });
    }

    res.json({ message: 'Guardia eliminada correctamente' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar guardia' });
  }
};

module.exports = { listarGuardias, crearGuardia, actualizarGuardia, eliminarGuardia };
