const express = require('express');
const router = express.Router();
const customFieldsController = require('../controllers/custom-fields.controller');

router.get('/todos', customFieldsController.listarTodos);
router.get('/', customFieldsController.listarCustomFields);
router.get('/:id', customFieldsController.obtenerCustomField);
router.post('/', customFieldsController.crearCustomField);
router.put('/:id', customFieldsController.actualizarCustomField);
router.delete('/:id', customFieldsController.eliminarCustomField);

module.exports = router;

