const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');

router.get('/pacientes', chatController.listarPacientesConChat);
router.get('/mensajes', chatController.listarMensajes);
router.post('/mensajes', chatController.enviarMensaje);
router.post('/webhook', chatController.webhookKapso);

module.exports = router;
