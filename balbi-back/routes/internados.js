const express = require('express');
const router = express.Router();
const c = require('../controllers/internados.controller');

router.get('/', c.listarInternados);
router.post('/', c.crearInternado);
router.put('/:id/alta', c.darDeAlta);
router.put('/:id', c.actualizarInternado);
router.delete('/:id', c.eliminarInternado);

module.exports = router;
