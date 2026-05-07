const { connectDB } = require('../config/database');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

// Cargar modelos para establecer relaciones
require('../models');

const AUTH_USER = process.env.AUTH_USER;
const AUTH_PASSWORD = process.env.AUTH_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';
const API_KEY = process.env.API_KEY;

const safeCompare = (received, expected) => {
  if (typeof received !== 'string' || typeof expected !== 'string') {
    return false;
  }

  const a = Buffer.from(received, 'utf8');
  const b = Buffer.from(expected, 'utf8');

  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(a, b);
};

// Middleware para validar API KEY
const validateApiKey = (req, res, next) => {
  if (!API_KEY) {
    console.error('❌ API_KEY no está definida');
    return res.status(500).json({ error: 'Configuración de API incompleta' });
  }

  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'API Key no proporcionada' });
  }

  if (!safeCompare(apiKey, API_KEY)) {
    return res.status(401).json({ error: 'API Key inválida' });
  }

  next();
};

module.exports = async (app) => {
  try {
    // Conectar a la base de datos
    await connectDB();
    console.log('✅ Base de datos conectada correctamente');

    // Importar todas las rutas
    const authRoutes = require('./auth');
    const rolesRoutes = require('./roles');
    const usuariosRoutes = require('./usuarios');
    const profesionalesRoutes = require('./profesionales');
    const pacientesRoutes = require('./pacientes');
    const serviciosRoutes = require('./servicios');
    const turnosRoutes = require('./turnos');
    const chatRoutes = require('./chat');
    const apiV1Routes = require('./api-v1');
    const horariosRoutes = require('./horarios');
    const consultasRoutes = require('./consultas');
    const fichasRoutes = require('./fichas');
    const filesRoutes = require('./files');
    const bloqueosAgendaRoutes = require('./bloqueos-agenda');
    const eventosAgendaRoutes = require('./eventos-agenda');
    const mascotasRoutes = require('./mascotas');
    const vacunasRoutes = require('./vacunas');
    const customFieldsRoutes = require('./custom-fields');

    // Middleware para proteger endpoints salvo los públicos
    // Solo aplicar a rutas que empiecen con /api
    app.use('/api', (req, res, next) => {
      const originalUrl = req.originalUrl || req.url;

      // Excluir /api/v1 del middleware JWT (tiene su propio middleware de API KEY)
      if (originalUrl.startsWith('/api/v1')) {
        return next();
      }

      // Rutas públicas que no requieren autenticación
      const publicRoutes = [
        '/api/auth/register',
        '/api/auth/login',
        '/api/servicios/publico',
        '/api/chat/webhook'
      ];

      const isPublicRoute = publicRoutes.some(route => originalUrl === route || originalUrl.startsWith(route));

      if (req.method === 'OPTIONS' || originalUrl.includes('/public') || isPublicRoute) {
        return next();
      }

      if (!JWT_SECRET) {
        console.error('❌ JWT_SECRET no está definido');
        return res.status(500).json({ error: 'Configuración de autenticación incompleta' });
      }

      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token no proporcionado' });
      }

      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        return next();
      } catch (err) {
        console.warn('⚠️ Token inválido o expirado:', err.message);
        return res.status(401).json({ error: 'Token inválido o expirado' });
      }
    });

    // Middleware de API KEY para /api/v1
    app.use('/api/v1', validateApiKey);

    // Registrar todas las rutas API
    app.use('/api/auth', authRoutes);
    app.use('/api/roles', rolesRoutes);
    app.use('/api/usuarios', usuariosRoutes);
    app.use('/api/profesionales', profesionalesRoutes);
    app.use('/api/pacientes', pacientesRoutes);
    app.use('/api/servicios', serviciosRoutes);
    app.use('/api/turnos', turnosRoutes);
    app.use('/api/chat', chatRoutes);
    app.use('/api/horarios', horariosRoutes);
    app.use('/api/consultas', consultasRoutes);
    app.use('/api/fichas', fichasRoutes);
    app.use('/api/files', filesRoutes);
    app.use('/api/bloqueos-agenda', bloqueosAgendaRoutes);
    app.use('/api/eventos-agenda', eventosAgendaRoutes);
    app.use('/api/mascotas', mascotasRoutes);
    app.use('/api/vacunas', vacunasRoutes);
    app.use('/api/custom-fields', customFieldsRoutes);
    app.use('/api/v1', apiV1Routes);

    console.log('✅ Todas las rutas registradas correctamente');

  } catch (error) {
    console.error('❌ Error inicializando la aplicación:', error);
    process.exit(1);
  }
};
