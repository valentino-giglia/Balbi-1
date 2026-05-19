const express = require('express');
const router = express.Router();
const pacientesController = require('../controllers/pacientes.controller');
const { authorize } = require('../middleware/auth');

// Lectura: todos los roles autenticados
router.get('/', pacientesController.listarPacientes);
router.get('/:id/historial', pacientesController.obtenerHistorialPaciente);
router.get('/:id/historial-clinico', pacientesController.obtenerResumenHistorialClinico);
router.get('/:id', pacientesController.obtenerPaciente);

// Escritura: admin y recepcion
router.post('/', authorize('admin', 'recepcion'), pacientesController.crearPaciente);
router.put('/:id', authorize('admin', 'recepcion'), pacientesController.actualizarPaciente);
router.delete('/:id', authorize('admin'), pacientesController.eliminarPaciente);

module.exports = router;
