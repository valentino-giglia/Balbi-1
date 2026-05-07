const { Fichas, Pacientes, Mascotas } = require('../models');

const listarFichas = async (req, res) => {
  try {
    const { pacienteID, mascotaID } = req.query;
    const where = {};

    if (mascotaID) {
      where.mascotaID = mascotaID;
    } else if (pacienteID) {
      where.pacienteID = pacienteID;
    }

    const fichas = await Fichas.findAll({
      where,
      include: [
        {
          model: Pacientes,
          as: 'paciente',
          required: false,
          attributes: ['id', 'nombre', 'email', 'telefono']
        },
        {
          model: Mascotas,
          as: 'mascota',
          required: false,
          attributes: ['id', 'nombre']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(fichas);
  } catch (error) {
    console.error('Error listando fichas:', error);
    res.status(500).json({ error: 'Error al listar fichas' });
  }
};

const obtenerFicha = async (req, res) => {
  try {
    const { id } = req.params;
    const ficha = await Fichas.findByPk(id, {
      include: [
        {
          model: Pacientes,
          as: 'paciente',
          required: false
        },
        {
          model: Mascotas,
          as: 'mascota',
          required: false
        }
      ]
    });

    if (!ficha) {
      return res.status(404).json({ error: 'Ficha no encontrada' });
    }

    res.json(ficha);
  } catch (error) {
    console.error('Error obteniendo ficha:', error);
    res.status(500).json({ error: 'Error al obtener ficha' });
  }
};

const crearFicha = async (req, res) => {
  try {
    const { pacienteID, mascotaID, notas, extra } = req.body;

    if (!pacienteID && !mascotaID) {
      return res.status(400).json({ error: 'pacienteID o mascotaID es requerido' });
    }

    if (pacienteID) {
      const paciente = await Pacientes.findByPk(pacienteID);
      if (!paciente) {
        return res.status(404).json({ error: 'Paciente no encontrado' });
      }
    }
    let mascota = null;
    if (mascotaID) {
      mascota = await Mascotas.findByPk(mascotaID);
      if (!mascota) {
        return res.status(404).json({ error: 'Mascota no encontrada' });
      }
    }

    const fichaPacienteID = pacienteID || (mascota ? mascota.pacienteID : null);
    if (!fichaPacienteID) {
      return res.status(400).json({ error: 'pacienteID o mascotaID (de una mascota existente) es requerido' });
    }

    const ficha = await Fichas.create({
      pacienteID: fichaPacienteID,
      mascotaID: mascotaID || null,
      notas: notas || null,
      extra: extra || null
    });

    const fichaCompleta = await Fichas.findByPk(ficha.id, {
      include: [
        { model: Pacientes, as: 'paciente', required: false },
        { model: Mascotas, as: 'mascota', required: false }
      ]
    });

    res.status(201).json(fichaCompleta);
  } catch (error) {
    console.error('Error creando ficha:', error);
    res.status(500).json({ error: 'Error al crear ficha' });
  }
};

const actualizarFicha = async (req, res) => {
  try {
    const { id } = req.params;
    const { notas, extra, pacienteID, mascotaID } = req.body;

    const ficha = await Fichas.findByPk(id);
    if (!ficha) {
      return res.status(404).json({ error: 'Ficha no encontrada' });
    }

    if (pacienteID) {
      const paciente = await Pacientes.findByPk(pacienteID);
      if (!paciente) {
        return res.status(404).json({ error: 'Paciente no encontrado' });
      }
    }
    if (mascotaID) {
      const mascota = await Mascotas.findByPk(mascotaID);
      if (!mascota) {
        return res.status(404).json({ error: 'Mascota no encontrada' });
      }
    }

    const updateData = {};
    if (notas !== undefined) updateData.notas = notas;
    if (extra !== undefined) updateData.extra = extra;
    if (pacienteID !== undefined) updateData.pacienteID = pacienteID;
    if (mascotaID !== undefined) updateData.mascotaID = mascotaID;

    await ficha.update(updateData);

    const fichaActualizada = await Fichas.findByPk(id, {
      include: [
        { model: Pacientes, as: 'paciente', required: false },
        { model: Mascotas, as: 'mascota', required: false }
      ]
    });

    res.json(fichaActualizada);
  } catch (error) {
    console.error('Error actualizando ficha:', error);
    res.status(500).json({ error: 'Error al actualizar ficha' });
  }
};

const eliminarFicha = async (req, res) => {
  try {
    const { id } = req.params;
    const ficha = await Fichas.findByPk(id);

    if (!ficha) {
      return res.status(404).json({ error: 'Ficha no encontrada' });
    }

    await ficha.destroy();
    res.json({ message: 'Ficha eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando ficha:', error);
    res.status(500).json({ error: 'Error al eliminar ficha' });
  }
};

module.exports = {
  listarFichas,
  obtenerFicha,
  crearFicha,
  actualizarFicha,
  eliminarFicha
};
