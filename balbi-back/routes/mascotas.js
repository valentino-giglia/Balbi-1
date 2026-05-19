const express = require('express');
const router = express.Router();
const mascotasController = require('../controllers/mascotas.controller');
const { authorize } = require('../middleware/auth');

// Lectura: todos los roles autenticados
router.get('/', mascotasController.listar);
router.get('/:id/historial-clinico', mascotasController.obtenerHistorialClinico);
router.get('/:id', mascotasController.obtener);

// Co-tutores: admin y recepcion
router.post('/:id/co-tutores', authorize('admin', 'recepcion'), mascotasController.agregarCoTutor);
router.delete('/:id/co-tutores/:pacienteID', authorize('admin', 'recepcion'), mascotasController.quitarCoTutor);

// Escritura: admin, veterinario y recepcion
router.post('/', authorize('admin', 'veterinario', 'recepcion'), mascotasController.crear);
router.put('/:id', authorize('admin', 'veterinario', 'recepcion'), mascotasController.actualizar);
router.delete('/:id', authorize('admin'), mascotasController.eliminar);

module.exports = router;
