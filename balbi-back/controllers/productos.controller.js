const { Productos } = require('../models');

const listarProductos = async (req, res) => {
  try {
    const where = { estado: 'ACTIVO' };

    if (req.query.categoria) {
      where.categoria = req.query.categoria;
    }

    const productos = await Productos.findAll({
      where,
      order: [['nombre', 'ASC']]
    });
    res.json(productos);
  } catch (e) {
    res.status(500).json({ error: 'Error al listar productos' });
  }
};

const crearProducto = async (req, res) => {
  try {
    const { nombre, categoria, costo, venta, stock, unidad, proveedor } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const producto = await Productos.create({
      nombre,
      categoria,
      costo,
      venta,
      stock,
      unidad,
      proveedor
    });

    res.status(201).json(producto);
  } catch (e) {
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const [updated] = await Productos.update(data, { where: { id } });

    if (!updated) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const producto = await Productos.findByPk(id);
    res.json(producto);
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Productos.update({ estado: 'BAJA' }, { where: { id } });

    if (!updated) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto eliminado correctamente' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
};

module.exports = { listarProductos, crearProducto, actualizarProducto, eliminarProducto };
