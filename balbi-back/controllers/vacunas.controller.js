const { Vacunas, Mascotas } = require('../models');

const listar = async (req, res) => {
  try {
    const { mascotaID } = req.query;
    const where = {};
    if (mascotaID) {
      where.mascotaID = mascotaID;
    }
    const vacunas = await Vacunas.findAll({
      where,
      include: [{ model: Mascotas, as: 'mascota', attributes: ['id', 'nombre'] }],
      order: [['fechaAplicacion', 'DESC']]
    });
    res.json(vacunas);
  } catch (error) {
    console.error('Error listando vacunas:', error);
    res.status(500).json({ error: 'Error al listar vacunas' });
  }
};

const obtener = async (req, res) => {
  try {
    const { id } = req.params;
    const vacuna = await Vacunas.findByPk(id, {
      include: [{ model: Mascotas, as: 'mascota', attributes: ['id', 'nombre'] }]
    });
    if (!vacuna) {
      return res.status(404).json({ error: 'Vacuna no encontrada' });
    }
    res.json(vacuna);
  } catch (error) {
    console.error('Error obteniendo vacuna:', error);
    res.status(500).json({ error: 'Error al obtener vacuna' });
  }
};

const crear = async (req, res) => {
  try {
    const { mascotaID, nombre, fechaAplicacion, proximaDosis, notas } = req.body;
    if (!mascotaID || !nombre || !fechaAplicacion) {
      return res.status(400).json({ error: 'mascotaID, nombre y fechaAplicacion son requeridos' });
    }
    const mascota = await Mascotas.findByPk(mascotaID);
    if (!mascota) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }
    const vacuna = await Vacunas.create({
      mascotaID,
      nombre,
      fechaAplicacion,
      proximaDosis: proximaDosis || null,
      notas: notas || null
    });
    const conMascota = await Vacunas.findByPk(vacuna.id, {
      include: [{ model: Mascotas, as: 'mascota', attributes: ['id', 'nombre'] }]
    });
    res.status(201).json(conMascota);
  } catch (error) {
    console.error('Error creando vacuna:', error);
    res.status(500).json({ error: 'Error al crear vacuna' });
  }
};

const actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { mascotaID, nombre, fechaAplicacion, proximaDosis, notas } = req.body;
    const vacuna = await Vacunas.findByPk(id);
    if (!vacuna) {
      return res.status(404).json({ error: 'Vacuna no encontrada' });
    }
    if (mascotaID) {
      const mascota = await Mascotas.findByPk(mascotaID);
      if (!mascota) return res.status(404).json({ error: 'Mascota no encontrada' });
    }
    const updateData = {};
    if (mascotaID !== undefined) updateData.mascotaID = mascotaID;
    if (nombre !== undefined) updateData.nombre = nombre;
    if (fechaAplicacion !== undefined) updateData.fechaAplicacion = fechaAplicacion;
    if (proximaDosis !== undefined) updateData.proximaDosis = proximaDosis;
    if (notas !== undefined) updateData.notas = notas;
    await vacuna.update(updateData);
    const conMascota = await Vacunas.findByPk(vacuna.id, {
      include: [{ model: Mascotas, as: 'mascota', attributes: ['id', 'nombre'] }]
    });
    res.json(conMascota);
  } catch (error) {
    console.error('Error actualizando vacuna:', error);
    res.status(500).json({ error: 'Error al actualizar vacuna' });
  }
};

const eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const vacuna = await Vacunas.findByPk(id);
    if (!vacuna) {
      return res.status(404).json({ error: 'Vacuna no encontrada' });
    }
    await vacuna.destroy();
    res.json({ message: 'Vacuna eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando vacuna:', error);
    res.status(500).json({ error: 'Error al eliminar vacuna' });
  }
};

module.exports = { listar, obtener, crear, actualizar, eliminar };
