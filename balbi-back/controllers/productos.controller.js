const { Productos } = require('../models');
const { getSheets, SHEET_ID } = require('../config/google');

// ── Google Sheets sync — hoja "Lista" ────────────────────────────

async function sincronizarTodosLosProductos() {
  try {
    const productos = await Productos.findAll({
      where: { estado: 'ACTIVO' },
      order: [['categoria', 'ASC'], ['nombre', 'ASC']]
    });
    const sheets = await getSheets();

    const header = [['Categoría', 'Nombre', 'Costo', 'Precio Venta', 'Margen %', 'Stock', 'Unidad', 'Proveedor']];
    const rows = productos.map(p => {
      const costo = p.costo || 0;
      const venta = p.venta || 0;
      const margen = costo > 0 ? Math.round((venta - costo) / costo * 100) : '';
      return [p.categoria || '', p.nombre, costo, venta, margen, p.stock ?? '', p.unidad || '', p.proveedor || ''];
    });

    await sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: 'Lista!A:H' });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: 'Lista!A1',
      valueInputOption: 'RAW',
      requestBody: { values: [...header, ...rows] }
    });

    console.log(`✅ Google Sheets — ${productos.length} productos sincronizados en Lista`);
  } catch (err) {
    console.error('⚠️  Google Sheets — no se pudo sincronizar productos:', err.message);
  }
}

// ── Handlers ────────────────────────────────────────────────────

const listarProductos = async (req, res) => {
  try {
    const where = { estado: 'ACTIVO' };
    if (req.query.categoria) where.categoria = req.query.categoria;

    const productos = await Productos.findAll({ where, order: [['nombre', 'ASC']] });
    res.json(productos);
  } catch (e) {
    res.status(500).json({ error: 'Error al listar productos' });
  }
};

const crearProducto = async (req, res) => {
  try {
    const { nombre, categoria, costo, venta, stock, unidad, proveedor } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' });

    const producto = await Productos.create({ nombre, categoria, costo, venta, stock, unidad, proveedor });
    res.status(201).json(producto);
    sincronizarTodosLosProductos();
  } catch (e) {
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Productos.update(req.body, { where: { id } });
    if (!updated) return res.status(404).json({ error: 'Producto no encontrado' });

    const producto = await Productos.findByPk(id);
    res.json(producto);
    sincronizarTodosLosProductos();
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Productos.update({ estado: 'BAJA' }, { where: { id } });
    if (!updated) return res.status(404).json({ error: 'Producto no encontrado' });

    res.json({ message: 'Producto eliminado correctamente' });
    sincronizarTodosLosProductos();
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
};

module.exports = { listarProductos, crearProducto, actualizarProducto, eliminarProducto, sincronizarTodosLosProductos };
