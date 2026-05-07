const express = require('express');
const router = express.Router();
const turnosController = require('../controllers/turnos.controller');

router.get('/proximos', turnosController.listarTurnosProximos);
router.get('/antiguos', turnosController.listarTurnosAntiguos);
router.get('/por-mascota/:mascotaId', turnosController.listarTurnosTodosPorMascota);
router.get('/', turnosController.listarTurnos);
router.get('/:id', turnosController.obtenerTurno);
router.post('/', turnosController.crearTurno);
router.put('/:id', turnosController.actualizarTurno);
router.put('/:id/cancelar', turnosController.cancelarTurno);
router.patch('/:id/notas', turnosController.actualizarNotasTurno);
router.delete('/:id', turnosController.eliminarTurno);

module.exports = router;

