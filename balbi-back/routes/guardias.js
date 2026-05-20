const express = require('express');
const router = express.Router();
const c = require('../controllers/guardias.controller');

router.get('/', c.listarGuardias);
router.post('/', c.crearGuardia);
router.put('/:id', c.actualizarGuardia);
router.delete('/:id', c.eliminarGuardia);

module.exports = router;
