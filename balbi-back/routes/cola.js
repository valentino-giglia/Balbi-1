const express = require('express');
const router = express.Router();
const c = require('../controllers/cola.controller');

router.get('/', c.listarCola);
router.post('/', c.agregarACola);
router.put('/:id/atender', c.atenderCola);
router.put('/:id', c.actualizarCola);
router.delete('/:id', c.eliminarCola);

module.exports = router;
