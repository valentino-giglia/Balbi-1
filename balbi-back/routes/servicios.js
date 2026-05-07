const express = require('express');
const router = express.Router();
const serviciosController = require('../controllers/servicios.controller');

router.get('/', serviciosController.listarServicios);
router.get('/:id', serviciosController.obtenerServicio);
router.post('/', serviciosController.crearServicio);
router.put('/:id', serviciosController.actualizarServicio);
router.delete('/:id', serviciosController.eliminarServicio);

module.exports = router;

