const { LibretaItem, Mascotas } = require('../models');

const listar = async (req, res) => {
  try {
    const { mascotaID, categoria } = req.query;
    const where = {};
    if (mascotaID) where.mascotaID = parseInt(mascotaID);
    if (categoria) where.categoria = categoria;
    const items = await LibretaItem.findAll({
      where,
      order: [['fecha', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json(items);
  } catch (err) {
    console.error('Error listando libreta:', err);
    res.status(500).json({ error: 'Error al listar libreta' });
  }
};

const crear = async (req, res) => {
  try {
    const { mascotaID, categoria, nombre, fecha, proxima, status, notas } = req.body;
    if (!mascotaID || !nombre || !categoria) {
      return res.status(400).json({ error: 'mascotaID, categoria y nombre son requeridos' });
    }
    const item = await LibretaItem.create({
      mascotaID: parseInt(mascotaID),
      categoria,
      nombre,
      fecha: fecha || null,
      proxima: proxima || null,
      status: status || 'vigente',
      notas: notas || null
    });
    if (categoria === 'alergias') await sincronizarAlergias(mascotaID);
    res.status(201).json(item);
  } catch (err) {
    console.error('Error creando item libreta:', err);
    res.status(500).json({ error: 'Error al crear item de libreta' });
  }
};

const actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, fecha, proxima, status, notas } = req.body;
    const item = await LibretaItem.findByPk(id);
    if (!item) return res.status(404).json({ error: 'Item no encontrado' });
    await item.update({
      nombre: nombre ?? item.nombre,
      fecha: fecha !== undefined ? (fecha || null) : item.fecha,
      proxima: proxima !== undefined ? (proxima || null) : item.proxima,
      status: status ?? item.status,
      notas: notas !== undefined ? (notas || null) : item.notas
    });
    if (item.categoria === 'alergias') await sincronizarAlergias(item.mascotaID);
    res.json(item);
  } catch (err) {
    console.error('Error actualizando item libreta:', err);
    res.status(500).json({ error: 'Error al actualizar item de libreta' });
  }
};

const eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await LibretaItem.findByPk(id);
    if (!item) return res.status(404).json({ error: 'Item no encontrado' });
    const { mascotaID, categoria } = item;
    await item.destroy();
    if (categoria === 'alergias') await sincronizarAlergias(mascotaID);
    res.json({ message: 'Item eliminado' });
  } catch (err) {
    console.error('Error eliminando item libreta:', err);
    res.status(500).json({ error: 'Error al eliminar item de libreta' });
  }
};

async function sincronizarAlergias(mascotaID) {
  try {
    const items = await LibretaItem.findAll({ where: { mascotaID, categoria: 'alergias' } });
    const alergias = items.length ? items.map(i => i.nombre).join(', ') : 'Ninguna';
    await Mascotas.update({ alergias }, { where: { id: mascotaID } });
  } catch (e) {
    console.error('Error sincronizando alergias:', e);
  }
}

module.exports = { listar, crear, actualizar, eliminar };
