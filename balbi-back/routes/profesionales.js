const express = require('express');
const router = express.Router();
const profesionalesController = require('../controllers/profesionales.controller');

router.get('/', profesionalesController.listarProfesionales);
router.get('/:id', profesionalesController.obtenerProfesional);
router.post('/', profesionalesController.crearProfesional);
router.put('/:id/servicios', profesionalesController.actualizarServiciosProfesional);
router.put('/:id', profesionalesController.actualizarProfesional);
router.delete('/:id', profesionalesController.eliminarProfesional);

module.exports = router;

