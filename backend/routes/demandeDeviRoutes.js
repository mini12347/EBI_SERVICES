const express = require('express');
const router = express.Router();
const controller = require('../controllers/demandeDeviController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.get('/client/:clientId', controller.getByClient);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

router.post('/:id/notes', controller.addNote);
router.get('/:id/notes', controller.getNotes);

module.exports = router;
