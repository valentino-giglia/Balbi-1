const express = require('express');
const router = express.Router();
const serviciosController = require('../controllers/servicios.controller');
const { authorize } = require('../middleware/auth');

// Lectura: todos los roles autenticados
router.get('/', serviciosController.listarServicios);
router.get('/:id', serviciosController.obtenerServicio);

// Escritura de precios/servicios: solo admin
router.post('/', authorize('admin'), serviciosController.crearServicio);
router.put('/:id', authorize('admin'), serviciosController.actualizarServicio);
router.delete('/:id', authorize('admin'), serviciosController.eliminarServicio);

module.exports = router;
