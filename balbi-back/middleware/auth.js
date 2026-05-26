const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || '5a1fd1a6f0c94f0da3d6d6f0a615953d1d24a7d945f5b61d43b27554c8f9ed43';

// Verifica JWT y adjunta req.user
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  try {
    req.user = jwt.verify(authHeader.substring(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// Permite solo los roles especificados
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  if (!roles.includes(req.user.rol)) {
    return res.status(403).json({ error: 'Sin permiso para esta acción' });
  }
  next();
};

module.exports = { authenticate, authorize };
