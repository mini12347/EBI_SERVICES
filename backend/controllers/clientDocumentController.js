const Document = require('../models/document');
const DemandeDevis = require('../models/demandeDevi');
const Notification = require('../models/notification');
const User = require('../models/utilisateur');

const notifyAdmins = async (document) => {
    const admins = await User.find({ role: 'admin' }).select('_id');
    if (admins.length) {
        await Notification.insertMany(admins.map(({ _id }) => ({
            destinataire: _id,
            type: 'nouveau_document',
            reference_id: document._id,
            contenu: `Un client a envoyé le document « ${document.nom_fichier} ».`,
        })));
    }
};

const createClientDocument = async (req, res, demandeId) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Aucun fichier téléchargé' });
    }

    let demande;
    if (demandeId) {
        demande = await DemandeDevis.findOne({ _id: demandeId, client: req.user._id });
        if (!demande) return res.status(404).json({ message: 'Demande non trouvée ou accès non autorisé' });
    }

    const doc = await Document.create({
        client: req.user._id,
        demande: demande?._id,
        nom_fichier: req.file.originalname,
        lien: req.file.path,
        uploaded_by: req.user._id,
        origine: 'client',
        taille: req.file.size,
        type_mime: req.file.mimetype,
    });
    await notifyAdmins(doc);
    return res.status(201).json({ message: 'Document uploadé avec succès', document: doc });
};

// @desc    Upload a document for a specific request
// @route   POST /api/client/demandes/:id/documents
const uploadDocument = async (req, res) => {
    try {
        await createClientDocument(req, res, req.params.id);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Upload a general document (no demande association)
// @route   POST /api/client/documents
const uploadGeneralDocument = async (req, res) => {
    try {
        await createClientDocument(req, res);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all documents for a specific request
// @route   GET /api/client/demandes/:id/documents
const getMesDocuments = async (req, res) => {
    try {
        const demande = await DemandeDevis.findOne({ _id: req.params.id, client: req.user._id });
        if (!demande) return res.status(404).json({ message: 'Demande non trouvée' });

        const documents = await Document.find({ demande: demande._id, client: req.user._id })
            .populate('uploaded_by', 'fullname role');
            
        res.status(200).json(documents);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    uploadDocument,
    uploadGeneralDocument,
    getMesDocuments,
};
