const express = require('express');
const router = express.Router();
const consultasController = require('../controllers/consultas.controller');
const { authorize } = require('../middleware/auth');

// Lectura: todos los roles autenticados
router.get('/', consultasController.listarConsultas);
router.get('/:id', consultasController.obtenerConsulta);

// Escritura: admin y veterinario
router.post('/', authorize('admin', 'veterinario'), consultasController.crearConsulta);
router.put('/:id', authorize('admin', 'veterinario'), consultasController.actualizarConsulta);
router.delete('/:id', authorize('admin'), consultasController.eliminarConsulta);

module.exports = router;
