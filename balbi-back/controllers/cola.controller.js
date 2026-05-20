const { Cola } = require('../models');

const listarCola = async (req, res) => {
  try {
    const cola = await Cola.findAll({
      where: { estado: 'ESPERANDO' },
      order: [['createdAt', 'ASC']]
    });
    res.json(cola);
  } catch (e) {
    res.status(500).json({ error: 'Error al listar cola de atención' });
  }
};

const agregarACola = async (req, res) => {
  try {
    const { petName, species, ownerName, motivo, triage, espera, primera, llegada } = req.body;

    const entrada = await Cola.create({
      petName,
      species,
      ownerName,
      motivo,
      triage,
      espera,
      primera,
      llegada
    });

    res.status(201).json(entrada);
  } catch (e) {
    res.status(500).json({ error: 'Error al agregar a la cola' });
  }
};

const actualizarCola = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const [updated] = await Cola.update(data, { where: { id } });

    if (!updated) {
      return res.status(404).json({ error: 'Entrada en cola no encontrada' });
    }

    const entrada = await Cola.findByPk(id);
    res.json(entrada);
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar cola' });
  }
};

const atenderCola = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Cola.update({ estado: 'ATENDIDO' }, { where: { id } });

    if (!updated) {
      return res.status(404).json({ error: 'Entrada en cola no encontrada' });
    }

    res.json({ message: 'Paciente atendido correctamente' });
  } catch (e) {
    res.status(500).json({ error: 'Error al atender paciente en cola' });
  }
};

const eliminarCola = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Cola.update({ estado: 'BAJA' }, { where: { id } });

    if (!updated) {
      return res.status(404).json({ error: 'Entrada en cola no encontrada' });
    }

    res.json({ message: 'Entrada eliminada de la cola' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar de la cola' });
  }
};

module.exports = { listarCola, agregarACola, actualizarCola, atenderCola, eliminarCola };
