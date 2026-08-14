const express = require('express');
const router = express.Router();
const controller = require('../controllers/tokenController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.get('/utilisateur/:utilisateurId', controller.getByUtilisateur);
router.post('/', controller.create);
router.patch('/:id/revoke', controller.revoke);
router.delete('/:id', controller.delete);

module.exports = router;
