const express = require('express');
const router = express.Router();
const turnosController = require('../controllers/turnos.controller');
const { authorize } = require('../middleware/auth');

// Lectura: todos los roles autenticados
router.get('/proximos', turnosController.listarTurnosProximos);
router.get('/antiguos', turnosController.listarTurnosAntiguos);
router.get('/por-mascota/:mascotaId', turnosController.listarTurnosTodosPorMascota);
router.get('/', turnosController.listarTurnos);
router.get('/:id', turnosController.obtenerTurno);

// Escritura: admin y recepcion
router.post('/', authorize('admin', 'recepcion'), turnosController.crearTurno);
router.put('/:id', authorize('admin', 'recepcion'), turnosController.actualizarTurno);
router.put('/:id/cancelar', authorize('admin', 'recepcion'), turnosController.cancelarTurno);
router.patch('/:id/notas', authorize('admin', 'recepcion', 'veterinario'), turnosController.actualizarNotasTurno);
router.delete('/:id', authorize('admin'), turnosController.eliminarTurno);

module.exports = router;
