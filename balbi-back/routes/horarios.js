const express = require('express');
const router = express.Router();
const horariosController = require('../controllers/horarios.controller');

router.get('/', horariosController.listarHorarios);
router.get('/:id', horariosController.obtenerHorario);
router.post('/', horariosController.crearHorario);
router.post('/masivo', horariosController.crearHorariosMasivo);
router.put('/:id', horariosController.actualizarHorario);
router.delete('/:id', horariosController.eliminarHorario);
router.delete('/profesional/:profesionalID', horariosController.eliminarHorariosPorProfesional);

module.exports = router;
