const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        database: global.__dbConnected ? 'connected' : 'degraded',
    });
});

router.use('/auth', require('./authRoutes'));
router.use('/client', require('./clientRoutes'));
router.use('/utilisateurs', require('./utilisateurRoutes'));
router.use('/demandes', require('./demandeDeviRoutes'));
router.use('/devis', require('./deviRoutes'));
router.use('/documents', require('./documentRoutes'));
router.use('/messages', require('./messageRoutes'));
router.use('/notifications', require('./notificationRoutes'));
router.use('/tokens', require('./tokenRoutes'));
router.use('/form-responses', require('./formResponseRoutes'));
router.use('/appointments', require('./appointmentRoutes'));
router.use('/leads', require('./leadRoutes'));
router.use('/agent', require('./agentRoutes'));

module.exports = router;
