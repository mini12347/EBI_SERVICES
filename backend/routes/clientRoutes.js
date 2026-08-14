const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const isClient = require('../middleware/isClient');

const demandeController = require('../controllers/clientDemandeController');
const documentController = require('../controllers/clientDocumentController');
const notificationController = require('../controllers/clientNotificationController');
const upload = require('../config/multerConfig');

// Protect all client routes
router.use(authMiddleware);
router.use(isClient);

// --- DEMANDES ---
router.get('/demandes', demandeController.getMesDemandes);
router.get('/demandes/:id', demandeController.getDemandeDetail);
router.get('/demandes/:id/messages', demandeController.getMessages);
router.post('/demandes/:id/messages', demandeController.sendMessage);
router.get('/demandes/:id/historique', demandeController.getHistorique);

// --- DOCUMENTS ---
router.get('/demandes/:id/documents', documentController.getMesDocuments);
router.post('/demandes/:id/documents', upload.single('document'), documentController.uploadDocument);
router.post('/documents', upload.single('document'), documentController.uploadGeneralDocument);

// --- DEVIS ---
router.get('/devis/:id/download', demandeController.downloadDevis);

// --- NOTIFICATIONS ---
router.get('/notifications', notificationController.getNotifications);
router.patch('/notifications/read-all', notificationController.markAllAsRead); // order matters, read-all before :id
router.patch('/notifications/:id/read', notificationController.markAsRead);

module.exports = router;
