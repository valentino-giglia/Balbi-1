const express = require('express');
const router = express.Router();
const bloqueosAgendaController = require('../controllers/bloqueos-agenda.controller');

router.get('/', bloqueosAgendaController.listar);
router.get('/:id', bloqueosAgendaController.obtener);
router.post('/', bloqueosAgendaController.crear);
router.put('/:id', bloqueosAgendaController.actualizar);
router.delete('/:id', bloqueosAgendaController.eliminar);

module.exports = router;
