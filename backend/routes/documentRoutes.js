const express = require('express');
const router = express.Router();
const controller = require('../controllers/documentController');
const authMiddleware = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');
const upload = require('../config/multerConfig');

router.use(authMiddleware);

router.get('/client/:clientId', controller.getByClient);
router.post('/client/:clientId', isAdmin, upload.single('document'), controller.uploadForClient);
router.get('/', isAdmin, controller.getAll);
router.get('/demande/:demandeId', isAdmin, controller.getByDemande);
router.post('/', isAdmin, controller.create);
router.put('/:id', isAdmin, controller.update);
router.delete('/:id', controller.delete);
router.get('/:id/download', controller.download);
router.get('/:id/summary-pdf', controller.downloadSummaryPDF);
router.get('/:id', controller.getById);

module.exports = router;
