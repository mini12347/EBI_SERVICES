const mongoose = require('mongoose');

const messageInterneSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
    expediteur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
    contenu: { type: String, required: true },
    departement: { type: String, enum: ['general', 'development', 'recruitment', 'teleservices', 'bpo'], default: 'general' },
    lu: { type: Boolean, default: false }, 
  },
  { timestamps: true }
);

module.exports = mongoose.model('MessageInterne', messageInterneSchema);