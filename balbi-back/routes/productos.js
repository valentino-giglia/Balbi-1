const express = require('express');
const router = express.Router();
const c = require('../controllers/productos.controller');

router.get('/', c.listarProductos);
router.post('/', c.crearProducto);
router.put('/:id', c.actualizarProducto);
router.delete('/:id', c.eliminarProducto);

module.exports = router;
