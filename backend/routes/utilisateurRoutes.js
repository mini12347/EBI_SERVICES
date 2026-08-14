const express = require('express');
const router = express.Router();
const controller = require('../controllers/utilisateurController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', controller.getUtilisateurs);
router.get('/:id', controller.getUtilisateurById);
router.get('/role/:role', controller.getUtilisateursByRole);
router.post('/', controller.createUtilisateur);
router.put('/:id', controller.updateUtilisateur);
router.delete('/:id', controller.deleteUtilisateur);

module.exports = router;
