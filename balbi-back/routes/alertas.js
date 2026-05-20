const express = require('express');
const router = express.Router();
const c = require('../controllers/alertas.controller');

router.get('/', c.listarAlertas);
router.post('/', c.crearAlerta);
router.put('/:id/resolver', c.resolverAlerta);
router.delete('/:id', c.eliminarAlerta);

module.exports = router;
