const { Usuario, Rol, UsuarioRol } = require('../models');
const { Op } = require('sequelize');

// GET /api/usuarios
const listarUsuarios = async (req, res) => {
  try {
    const { estado, email, nombre } = req.query;
    const where = {};

    if (estado) {
      where.estado = estado;
    }
    if (email) {
      where.email = { [Op.like]: `%${email}%` };
    }
    if (nombre) {
      where.nombre = { [Op.like]: `%${nombre}%` };
    }

    const usuarios = await Usuario.findAll({
      where,
      attributes: { exclude: ['contrasena'] }
    });

    res.json(usuarios);
  } catch (error) {
    console.error('Error listando usuarios:', error);
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
};

// GET /api/usuarios/:id
const obtenerUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByPk(id, {
      attributes: { exclude: ['contrasena'] }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(usuario);
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
};

// PUT /api/usuarios/:id
const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, telefono, contrasena, estado } = req.body;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const updateData = {};
    if (nombre) updateData.nombre = nombre;
    if (email) updateData.email = email;
    if (telefono !== undefined) updateData.telefono = telefono;
    if (contrasena) updateData.contrasena = contrasena;
    if (estado) updateData.estado = estado;

    await usuario.update(updateData);

    const usuarioResponse = usuario.toJSON();
    delete usuarioResponse.contrasena;

    res.json(usuarioResponse);
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

// GET /api/usuarios/:id/roles
const obtenerRolesUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByPk(id, {
      include: [{
        model: Rol,
        as: 'roles',
        through: { attributes: [] }
      }]
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(usuario.roles || []);
  } catch (error) {
    console.error('Error obteniendo roles de usuario:', error);
    res.status(500).json({ error: 'Error al obtener roles de usuario' });
  }
};

module.exports = {
  listarUsuarios,
  obtenerUsuario,
  actualizarUsuario,
  obtenerRolesUsuario
};
