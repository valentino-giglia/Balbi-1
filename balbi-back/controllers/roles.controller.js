const { Rol } = require('../models');

// GET /api/roles
const listarRoles = async (req, res) => {
  try {
    const { estado } = req.query;
    const where = {};
    
    if (estado) {
      where.estado = estado;
    }

    const roles = await Rol.findAll({ where });
    res.json(roles);
  } catch (error) {
    console.error('Error listando roles:', error);
    res.status(500).json({ error: 'Error al listar roles' });
  }
};

// GET /api/roles/:id
const obtenerRol = async (req, res) => {
  try {
    const { id } = req.params;
    const rol = await Rol.findByPk(id);

    if (!rol) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }

    res.json(rol);
  } catch (error) {
    console.error('Error obteniendo rol:', error);
    res.status(500).json({ error: 'Error al obtener rol' });
  }
};

module.exports = {
  listarRoles,
  obtenerRol
};
