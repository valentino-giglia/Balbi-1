const express = require('express');
const router = express.Router();
const mascotasController = require('../controllers/mascotas.controller');

router.get('/', mascotasController.listar);
router.get('/:id/historial-clinico', mascotasController.obtenerHistorialClinico);
router.post('/:id/co-tutores', mascotasController.agregarCoTutor);
router.delete('/:id/co-tutores/:pacienteID', mascotasController.quitarCoTutor);
router.get('/:id', mascotasController.obtener);
router.post('/', mascotasController.crear);
router.put('/:id', mascotasController.actualizar);
router.delete('/:id', mascotasController.eliminar);

module.exports = router;
