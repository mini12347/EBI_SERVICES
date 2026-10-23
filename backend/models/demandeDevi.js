const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    contenu: String,
}, { timestamps: true });

const demandeDevisSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // admin assigné
    archivedAt: { type: Date, default: null },

    besoin: { type: String, required: true },
    secteur: { type: String, trim: true },
    budget: { type: String, trim: true },
    delai: { type: String, trim: true },
    statut: {
      type: String,
      enum: ['en_attente', 'en_cours', 'devis_envoye', 'accepte', 'refuse'],
      default: 'en_attente',
    },
    notes: [noteSchema],
  },
  { timestamps: true } // gives you created_at for "temps réel" status tracking
);

module.exports = mongoose.model('DemandeDevis', demandeDevisSchema);