const express = require('express');
const router = express.Router();
const pacientesController = require('../controllers/pacientes.controller');
const apiV1Controller = require('../controllers/api-v1.controller');


// Upsert de paciente
router.post('/pacientes/upsert', pacientesController.upsertPaciente);

// Endpoint para obtener servicios en formato texto (para contexto LLM)
router.get('/servicios/text', apiV1Controller.getServiciosText);

// Endpoint para obtener profesionales en formato texto
router.get('/profesionales/text', apiV1Controller.getProfesionalesText);

// Endpoint para crear turno usando códigos
router.post('/turnos', apiV1Controller.crearTurnoPorCodigos);

// Endpoint para obtener turnos del paciente en formato texto
router.get('/turnos/pacientes/:pacienteID/text', apiV1Controller.getTurnosPacienteText);

// Endpoint para obtener turnos agendados en formato texto
router.get('/turnos/text', apiV1Controller.getTurnosText);

// Endpoint para verificar turnos disponibles
router.get('/turnos/disponibles/text', apiV1Controller.getTurnosDisponiblesText);

// Endpoint para cancelar turno
router.delete('/turnos', apiV1Controller.cancelarTurno);


module.exports = router;

