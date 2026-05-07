const { Consultas, Turnos } = require('../models');

function nullIfEmptyText(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function parsePesoKg(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const listarConsultas = async (req, res) => {
  try {
    const { turnoID } = req.query;
    let where = {};

    if (turnoID) {
      const turno = await Turnos.findByPk(turnoID);
      if (!turno) {
        return res.status(404).json({ error: 'Turno no encontrado' });
      }
      if (turno.consultaID) {
        where.id = turno.consultaID;
      } else {
        return res.json([]);
      }
    }

    const consultas = await Consultas.findAll({
      where: Object.keys(where).length ? where : undefined,
      include: [
        {
          model: Turnos,
          as: 'turno',
          required: false,
          attributes: ['id', 'pacienteID', 'profesionalID', 'horaInicio', 'horaFin', 'estado']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(consultas);
  } catch (error) {
    console.error('Error listando consultas:', error);
    res.status(500).json({ error: 'Error al listar consultas' });
  }
};

const obtenerConsulta = async (req, res) => {
  try {
    const { id } = req.params;
    const consulta = await Consultas.findByPk(id, {
      include: [
        {
          model: Turnos,
          as: 'turno',
          required: false
        }
      ]
    });

    if (!consulta) {
      return res.status(404).json({ error: 'Consulta no encontrada' });
    }

    res.json(consulta);
  } catch (error) {
    console.error('Error obteniendo consulta:', error);
    res.status(500).json({ error: 'Error al obtener consulta' });
  }
};

const crearConsulta = async (req, res) => {
  try {
    const {
      nota,
      extra,
      turnoID,
      motivoConsulta,
      examenClinico,
      diagnostico,
      planTratamiento,
      pesoKg
    } = req.body;

    const consulta = await Consultas.create({
      nota: nota || null,
      extra: extra || null,
      motivoConsulta: nullIfEmptyText(motivoConsulta),
      examenClinico: nullIfEmptyText(examenClinico),
      diagnostico: nullIfEmptyText(diagnostico),
      planTratamiento: nullIfEmptyText(planTratamiento),
      pesoKg: parsePesoKg(pesoKg)
    });

    if (turnoID) {
      const turno = await Turnos.findByPk(turnoID);
      if (!turno) {
        return res.status(404).json({ error: 'Turno no encontrado' });
      }
      await turno.update({ consultaID: consulta.id });
    }

    const consultaCompleta = await Consultas.findByPk(consulta.id, {
      include: [
        {
          model: Turnos,
          as: 'turno',
          required: false
        }
      ]
    });

    res.status(201).json(consultaCompleta);
  } catch (error) {
    console.error('Error creando consulta:', error);
    res.status(500).json({ error: 'Error al crear consulta' });
  }
};

const actualizarConsulta = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nota,
      extra,
      motivoConsulta,
      examenClinico,
      diagnostico,
      planTratamiento,
      pesoKg
    } = req.body;

    const consulta = await Consultas.findByPk(id);
    if (!consulta) {
      return res.status(404).json({ error: 'Consulta no encontrada' });
    }

    const updateData = {};
    if (nota !== undefined) updateData.nota = nota;
    if (extra !== undefined) updateData.extra = extra;
    if (motivoConsulta !== undefined) updateData.motivoConsulta = nullIfEmptyText(motivoConsulta);
    if (examenClinico !== undefined) updateData.examenClinico = nullIfEmptyText(examenClinico);
    if (diagnostico !== undefined) updateData.diagnostico = nullIfEmptyText(diagnostico);
    if (planTratamiento !== undefined) updateData.planTratamiento = nullIfEmptyText(planTratamiento);
    if (pesoKg !== undefined) updateData.pesoKg = parsePesoKg(pesoKg);

    await consulta.update(updateData);

    const consultaActualizada = await Consultas.findByPk(id, {
      include: [
        {
          model: Turnos,
          as: 'turno',
          required: false
        }
      ]
    });

    res.json(consultaActualizada);
  } catch (error) {
    console.error('Error actualizando consulta:', error);
    res.status(500).json({ error: 'Error al actualizar consulta' });
  }
};

const eliminarConsulta = async (req, res) => {
  try {
    const { id } = req.params;
    const consulta = await Consultas.findByPk(id);

    if (!consulta) {
      return res.status(404).json({ error: 'Consulta no encontrada' });
    }

    await Turnos.update(
      { consultaID: null },
      { where: { consultaID: id } }
    );
    await consulta.destroy();

    res.json({ message: 'Consulta eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando consulta:', error);
    res.status(500).json({ error: 'Error al eliminar consulta' });
  }
};

module.exports = {
  listarConsultas,
  obtenerConsulta,
  crearConsulta,
  actualizarConsulta,
  eliminarConsulta
};
