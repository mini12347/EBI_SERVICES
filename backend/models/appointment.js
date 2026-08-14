const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    title: { type: String, required: true },
    date: { type: String, required: true },
    timeSlot: { type: String, required: true },
    timezone: { type: String, default: 'Europe/Paris' },
    slotDate: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
