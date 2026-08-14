const express = require('express');
const router = express.Router();
const controller = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.get('/client/:clientId', controller.getByClient);
router.post('/', controller.create);
router.patch('/:id/lu', controller.markAsLu);
router.delete('/:id', controller.delete);

module.exports = router;
