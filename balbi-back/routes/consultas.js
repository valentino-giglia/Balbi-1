const express = require('express');
const router = express.Router();
const consultasController = require('../controllers/consultas.controller');

router.get('/', consultasController.listarConsultas);
router.get('/:id', consultasController.obtenerConsulta);
router.post('/', consultasController.crearConsulta);
router.put('/:id', consultasController.actualizarConsulta);
router.delete('/:id', consultasController.eliminarConsulta);

module.exports = router;
