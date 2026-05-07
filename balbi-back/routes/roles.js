const express = require('express');
const router = express.Router();
const rolesController = require('../controllers/roles.controller');

// GET /api/roles
router.get('/', rolesController.listarRoles);

// GET /api/roles/:id
router.get('/:id', rolesController.obtenerRol);

module.exports = router;
