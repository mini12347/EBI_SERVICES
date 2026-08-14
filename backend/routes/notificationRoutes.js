const express = require('express');
const router = express.Router();
const controller = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.get('/destinataire/:destinataireId', controller.getByDestinataire);
router.post('/', controller.create);
router.patch('/:id/lu', controller.markAsLu);
router.patch('/destinataire/:destinataireId/lu', controller.markAllAsLu);
router.delete('/:id', controller.delete);

module.exports = router;
