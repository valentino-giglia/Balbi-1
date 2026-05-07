const express = require('express');
const router = express.Router();
const eventosAgendaController = require('../controllers/eventos-agenda.controller');

router.get('/', eventosAgendaController.listar);
router.get('/:id', eventosAgendaController.obtener);
router.post('/', eventosAgendaController.crear);
router.put('/:id', eventosAgendaController.actualizar);
router.delete('/:id', eventosAgendaController.eliminar);

module.exports = router;
