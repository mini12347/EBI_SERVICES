const express = require('express');
const router = express.Router();
const controller = require('../controllers/deviController');
const upload = require('../config/multerConfig');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.get('/demande/:demandeId', controller.getByDemande);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

// New Routes
router.post('/upload', upload.single('pdf'), controller.uploadQuotePDF);
router.get('/:id/download', controller.downloadQuotePDF);

module.exports = router;
