const express = require('express');
const router = express.Router();
const controller = require('../controllers/documentController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.get('/client/:clientId', controller.getByClient);
router.get('/demande/:demandeId', controller.getByDemande);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);
router.get('/:id/summary-pdf', controller.downloadSummaryPDF);

module.exports = router;
