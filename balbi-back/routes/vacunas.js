const express = require('express');
const router = express.Router();
const vacunasController = require('../controllers/vacunas.controller');

router.get('/', vacunasController.listar);
router.get('/:id', vacunasController.obtener);
router.post('/', vacunasController.crear);
router.put('/:id', vacunasController.actualizar);
router.delete('/:id', vacunasController.eliminar);

module.exports = router;
