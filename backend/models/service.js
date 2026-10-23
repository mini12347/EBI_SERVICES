const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    code: { type: String, unique: true, sparse: true, trim: true },
    nom: { type: String, required: true },
    description: { type: String },
    departement: {
        type: String,
        enum: ['development', 'recruitment', 'tele-services'],
    },
    actif: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
