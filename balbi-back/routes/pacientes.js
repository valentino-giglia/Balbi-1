const express = require('express');
const router = express.Router();
const pacientesController = require('../controllers/pacientes.controller');

router.get('/', pacientesController.listarPacientes);
router.get('/:id/historial', pacientesController.obtenerHistorialPaciente);
router.get('/:id/historial-clinico', pacientesController.obtenerResumenHistorialClinico);
router.get('/:id', pacientesController.obtenerPaciente);
router.post('/', pacientesController.crearPaciente);
router.put('/:id', pacientesController.actualizarPaciente);
router.delete('/:id', pacientesController.eliminarPaciente);

module.exports = router;

