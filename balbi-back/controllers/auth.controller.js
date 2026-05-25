const { Usuario, Rol } = require('../models');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { nombre, email, telefono, contrasena } = req.body;

    if (!nombre || !email || !contrasena) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
    }

    // Verificar si el usuario ya existe
    const usuarioExistente = await Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const usuario = await Usuario.create({
      nombre,
      email,
      telefono,
      contrasena,
      estado: 'ACTIVO'
    });

    // No devolver la contraseña
    const usuarioResponse = usuario.toJSON();
    delete usuarioResponse.contrasena;

    res.status(201).json(usuarioResponse);
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, contrasena } = req.body;

    if (!email || !contrasena) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const usuario = await Usuario.findOne({
      where: { email },
      include: [{ model: Rol, as: 'roles', through: { attributes: [] } }]
    });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (usuario.estado !== 'ACTIVO') {
      return res.status(401).json({ error: 'Usuario inactivo' });
    }

    const contrasenaValida = await usuario.validarContrasena(contrasena);
    if (!contrasenaValida) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const rolNombre = (usuario.roles && usuario.roles[0]?.nombre?.toLowerCase()) || 'admin';

    const payload = {
      sub: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: rolNombre
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

    res.json({
      token,
      expiresIn: JWT_EXPIRATION,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: rolNombre
      }
    });
  } catch (error) {
    console.error('Error en login:', error.message, error.stack);
    res.status(500).json({ error: 'Error al iniciar sesión', detalle: error.message });
  }
};

module.exports = {
  register,
  login
};
