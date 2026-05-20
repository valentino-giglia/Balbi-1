const { Internados, Mascotas, Profesionales } = require('../models');

const listarInternados = async (req, res) => {
  try {
    const internados = await Internados.findAll({
      where: { estadoPaciente: 'ACTIVO' },
      include: [
        {
          model: Mascotas,
          as: 'mascota',
          attributes: ['id', 'nombre', 'especie', 'raza']
        },
        {
          model: Profesionales,
          as: 'profesional',
          attributes: ['id', 'nombre']
        }
      ],
      order: [['ingreso', 'DESC']]
    });
    res.json(internados);
  } catch (e) {
    res.status(500).json({ error: 'Error al listar internados' });
  }
};

const crearInternado = async (req, res) => {
  try {
    const { mascotaID, profesionalID, estado, motivo, ingreso, plan, dieta, ubicacion } = req.body;

    const internado = await Internados.create({
      mascotaID,
      profesionalID,
      estado: estado || 'estable',
      motivo,
      ingreso: ingreso || new Date(),
      plan,
      dieta,
      ubicacion,
      controles: []
    });

    res.status(201).json(internado);
  } catch (e) {
    res.status(500).json({ error: 'Error al crear internado' });
  }
};

const actualizarInternado = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const [updated] = await Internados.update(data, { where: { id } });

    if (!updated) {
      return res.status(404).json({ error: 'Internado no encontrado' });
    }

    const internado = await Internados.findByPk(id);
    res.json(internado);
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar internado' });
  }
};

const darDeAlta = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Internados.update({ estadoPaciente: 'ALTA' }, { where: { id } });

    if (!updated) {
      return res.status(404).json({ error: 'Internado no encontrado' });
    }

    res.json({ message: 'Paciente dado de alta correctamente' });
  } catch (e) {
    res.status(500).json({ error: 'Error al dar de alta al internado' });
  }
};

const eliminarInternado = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Internados.update({ estadoPaciente: 'BAJA' }, { where: { id } });

    if (!updated) {
      return res.status(404).json({ error: 'Internado no encontrado' });
    }

    res.json({ message: 'Internado eliminado correctamente' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar internado' });
  }
};

module.exports = { listarInternados, crearInternado, actualizarInternado, darDeAlta, eliminarInternado };
