const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');
const leadController = require('../controllers/leadController');

// Public: the chatbot (first point of contact) submits leads without login
router.post('/', leadController.createLead);

// Admin-only management endpoints
router.get('/', authMiddleware, isAdmin, leadController.getAllLeads);
router.put('/:id', authMiddleware, isAdmin, leadController.updateLead);
router.delete('/:id', authMiddleware, isAdmin, leadController.deleteLead);

module.exports = router;
