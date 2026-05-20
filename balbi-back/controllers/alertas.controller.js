const { Alertas } = require('../models');

const listarAlertas = async (req, res) => {
  try {
    const alertas = await Alertas.findAll({
      where: { estado: 'ACTIVA' },
      order: [['createdAt', 'DESC']]
    });
    res.json(alertas);
  } catch (e) {
    res.status(500).json({ error: 'Error al listar alertas' });
  }
};

const crearAlerta = async (req, res) => {
  try {
    const { tipo, petName, msg, detalle, minutos, severity } = req.body;

    const alerta = await Alertas.create({
      tipo,
      petName,
      msg,
      detalle,
      minutos,
      severity
    });

    res.status(201).json(alerta);
  } catch (e) {
    res.status(500).json({ error: 'Error al crear alerta' });
  }
};

const resolverAlerta = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Alertas.update({ estado: 'RESUELTA' }, { where: { id } });

    if (!updated) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }

    res.json({ message: 'Alerta resuelta correctamente' });
  } catch (e) {
    res.status(500).json({ error: 'Error al resolver alerta' });
  }
};

const eliminarAlerta = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Alertas.update({ estado: 'BAJA' }, { where: { id } });

    if (!updated) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }

    res.json({ message: 'Alerta eliminada correctamente' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar alerta' });
  }
};

module.exports = { listarAlertas, crearAlerta, resolverAlerta, eliminarAlerta };
