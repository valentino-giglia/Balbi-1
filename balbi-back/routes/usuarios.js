const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarios.controller');

// GET /api/usuarios
router.get('/', usuariosController.listarUsuarios);

// GET /api/usuarios/:id
router.get('/:id', usuariosController.obtenerUsuario);

// PUT /api/usuarios/:id
router.put('/:id', usuariosController.actualizarUsuario);

// GET /api/usuarios/:id/roles
router.get('/:id/roles', usuariosController.obtenerRolesUsuario);

module.exports = router;
