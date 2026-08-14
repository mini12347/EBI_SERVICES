const express = require('express');
const router = express.Router();
const {
    createAppointment,
    getAppointmentsByUser,
    getAllAppointments,
    getAvailableSlots,
    updateAppointmentStatus,
    cancelAppointment,
} = require('../controllers/appointmentController');

router.get('/', getAllAppointments);
router.get('/availability', getAvailableSlots);
router.post('/', createAppointment);
router.get('/user/:userId', getAppointmentsByUser);
router.patch('/:id', updateAppointmentStatus);
router.patch('/:id/cancel', cancelAppointment);

module.exports = router;
