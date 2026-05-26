const { Servicios } = require('../models');
const { Op } = require('sequelize');
const { paginate } = require('../utils/pagination');
const { getSheets, SHEET_ID } = require('../config/google');

// ── Google Sheets sync ───────────────────────────────────────────

const SHEET_NAME = 'Servicios';

async function sincronizarTodosLosServicios() {
  try {
    const servicios = await Servicios.findAll({ order: [['id', 'ASC']] });
    const sheets = await getSheets();

    const header = [['ID', 'Nombre', 'Código', 'Precio', 'Estado']];
    const rows = servicios.map(s => [
      s.id,
      s.nombre,
      s.codigo,
      s.precio != null ? parseFloat(s.precio) : 0,
      s.estado
    ]);

    // Limpiar hoja y escribir desde A1
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:E`
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [...header, ...rows] }
    });

    console.log(`✅ Google Sheets — ${servicios.length} servicios sincronizados`);
  } catch (err) {
    console.error('⚠️  Google Sheets — no se pudo sincronizar servicios:', err.message);
  }
}

// ── Handlers ────────────────────────────────────────────────────

const listarServicios = async (req, res) => {
  try {
    const { estado, nombre, codigo, page = 1, pageSize = 10 } = req.query;
    const where = {};

    if (estado) {
      where.estado = estado;
    }
    if (nombre) {
      where.nombre = { [Op.like]: `%${nombre}%` };
    }
    if (codigo) {
      where.codigo = { [Op.like]: `%${codigo}%` };
    }

    const result = await paginate(Servicios, {
      where,
      order: [['nombre', 'ASC']],
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10)
    });

    res.json(result);
  } catch (error) {
    console.error('Error listando servicios:', error);
    res.status(500).json({ error: 'Error al listar servicios' });
  }
};

const obtenerServicio = async (req, res) => {
  try {
    const { id } = req.params;
    const servicio = await Servicios.findByPk(id);

    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    res.json(servicio);
  } catch (error) {
    console.error('Error obteniendo servicio:', error);
    res.status(500).json({ error: 'Error al obtener servicio' });
  }
};

const crearServicio = async (req, res) => {
  try {
    const { nombre, codigo, duracionMinutos, color, precio, estado } = req.body;

    if (!nombre || !codigo) {
      return res.status(400).json({ error: 'Nombre y código son requeridos' });
    }

    const servicioExistente = await Servicios.findOne({ where: { codigo } });
    if (servicioExistente) {
      return res.status(400).json({ error: 'El código del servicio ya existe' });
    }

    const servicio = await Servicios.create({
      nombre,
      codigo,
      duracionMinutos: duracionMinutos || 30,
      color: color || '#1976d2',
      precio: precio != null ? parseFloat(precio) : 0,
      estado: estado || 'ACTIVO'
    });

    res.status(201).json(servicio);
    sincronizarTodosLosServicios();
  } catch (error) {
    console.error('Error creando servicio:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'El código del servicio ya existe' });
    }
    res.status(500).json({ error: 'Error al crear servicio' });
  }
};

const actualizarServicio = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, codigo, duracionMinutos, color, precio, estado } = req.body;

    const servicio = await Servicios.findByPk(id);
    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    if (codigo && codigo !== servicio.codigo) {
      const servicioExistente = await Servicios.findOne({ where: { codigo } });
      if (servicioExistente) {
        return res.status(400).json({ error: 'El código del servicio ya existe' });
      }
    }

    const updateData = {};
    if (nombre) updateData.nombre = nombre;
    if (codigo) updateData.codigo = codigo;
    if (duracionMinutos !== undefined) updateData.duracionMinutos = duracionMinutos;
    if (color !== undefined) updateData.color = color;
    if (precio !== undefined) updateData.precio = parseFloat(precio);
    if (estado) updateData.estado = estado;

    await servicio.update(updateData);

    res.json(servicio);
    sincronizarTodosLosServicios();
  } catch (error) {
    console.error('Error actualizando servicio:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'El código del servicio ya existe' });
    }
    res.status(500).json({ error: 'Error al actualizar servicio' });
  }
};

const eliminarServicio = async (req, res) => {
  try {
    const { id } = req.params;
    const servicio = await Servicios.findByPk(id);

    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    await servicio.update({ estado: 'BAJA' });
    res.json({ message: 'Servicio eliminado correctamente' });
    sincronizarTodosLosServicios();
  } catch (error) {
    console.error('Error eliminando servicio:', error);
    res.status(500).json({ error: 'Error al eliminar servicio' });
  }
};

module.exports = {
  listarServicios,
  obtenerServicio,
  crearServicio,
  actualizarServicio,
  eliminarServicio,
  sincronizarTodosLosServicios
};
