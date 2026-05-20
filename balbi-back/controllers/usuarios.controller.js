const { Usuario, Rol, UsuarioRol } = require('../models');
const { Op } = require('sequelize');

// POST /api/usuarios — crear usuario desde admin
const crearUsuario = async (req, res) => {
  try {
    const { nombre, email, contrasena, rolID } = req.body;
    if (!nombre || !email || !contrasena) {
      return res.status(400).json({ error: 'nombre, email y contrasena son requeridos' });
    }
    const existente = await Usuario.findOne({ where: { email } });
    if (existente) return res.status(409).json({ error: 'Ya existe un usuario con ese email' });

    const nuevo = await Usuario.create({ nombre, email, contrasena, estado: 'ACTIVO' });

    if (rolID) {
      const rol = await Rol.findByPk(rolID);
      if (rol) await UsuarioRol.create({ usuarioID: nuevo.id, rolID, estado: 'ACTIVO' });
    }

    const respuesta = nuevo.toJSON();
    delete respuesta.contrasena;
    res.status(201).json(respuesta);
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

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

// PUT /api/usuarios/:id/roles  — reemplaza el rol del usuario
const asignarRol = async (req, res) => {
  try {
    const { id } = req.params;
    const { rolID } = req.body;

    if (!rolID) return res.status(400).json({ error: 'rolID es requerido' });

    const usuario = await Usuario.findByPk(id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const rol = await Rol.findByPk(rolID);
    if (!rol) return res.status(404).json({ error: 'Rol no encontrado' });

    await UsuarioRol.destroy({ where: { usuarioID: id } });
    await UsuarioRol.create({ usuarioID: id, rolID, estado: 'ACTIVO' });

    res.json({ message: 'Rol asignado', rolNombre: rol.nombre.toLowerCase() });
  } catch (error) {
    console.error('Error asignando rol:', error);
    res.status(500).json({ error: 'Error al asignar rol' });
  }
};

module.exports = {
  crearUsuario,
  listarUsuarios,
  obtenerUsuario,
  actualizarUsuario,
  obtenerRolesUsuario,
  asignarRol
};
