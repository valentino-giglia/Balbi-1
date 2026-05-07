const express = require('express');
const multer = require('multer');
const filesController = require('../controllers/files.controller');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB (imágenes y PDF)
  fileFilter: (req, file, cb) => {
    const isImage = /^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.mimetype);
    const isPdf = file.mimetype === 'application/pdf';
    if (isImage || isPdf) {
      cb(null, true);
    } else {
      cb(new Error('Se permiten imágenes (jpeg, png, gif, webp) y documentos PDF'), false);
    }
  }
});

router.get('/', filesController.listar);
router.post('/', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Error al subir archivo' });
    }
    next();
  });
}, filesController.subir);
router.delete('/:id', filesController.eliminar);

module.exports = router;
