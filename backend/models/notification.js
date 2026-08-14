const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    destinataire: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['nouveau_message', 'nouveau_devis', 'nouveau_document', 'statut_demande', 'nouveau_lead'],
      required: true,
    },
    reference_id: { type: mongoose.Schema.Types.ObjectId }, 
    contenu: { type: String, required: true },
    lu: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);