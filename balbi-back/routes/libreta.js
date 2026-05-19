const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/libreta.controller');
const { authorize } = require('../middleware/auth');

router.get('/', ctrl.listar);
router.post('/', authorize('admin', 'veterinario'), ctrl.crear);
router.put('/:id', authorize('admin', 'veterinario'), ctrl.actualizar);
router.delete('/:id', authorize('admin', 'veterinario'), ctrl.eliminar);

module.exports = router;
