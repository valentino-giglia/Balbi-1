const express = require('express');
const router = express.Router();
const fichasController = require('../controllers/fichas.controller');

router.get('/', fichasController.listarFichas);
router.get('/:id', fichasController.obtenerFicha);
router.post('/', fichasController.crearFicha);
router.put('/:id', fichasController.actualizarFicha);
router.delete('/:id', fichasController.eliminarFicha);

module.exports = router;
