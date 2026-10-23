const Document = require('../models/document');
const DemandeDevis = require('../models/demandeDevi');
const Notification = require('../models/notification');
const User = require('../models/utilisateur');
const { generateDocumentSummaryPDF } = require('../utils/pdfGenerator');
const path = require('path');
const fs = require('fs/promises');
const uploadsDir = path.resolve(__dirname, '..', 'uploads');

const canAccessDocument = (req, doc) =>
    req.user.role === 'admin' || doc.client?._id?.toString() === req.user.id || doc.client?.toString() === req.user.id;

const getStoredFilePath = (storedPath) => {
    const filePath = path.resolve(uploadsDir, path.basename(storedPath));
    if (path.dirname(filePath) !== uploadsDir) {
        throw new Error('Invalid stored document path');
    }
    return filePath;
};

const getAll = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
        const docs = await Document.find()
            .populate('client', '-password')
            .populate('demande')
            .populate('uploaded_by', '-password');
        res.status(200).json(docs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching documents', error: error.message });
    }
};

const getById = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id)
            .populate('client', '-password')
            .populate('demande')
            .populate('uploaded_by', '-password');
        if (!doc) return res.status(404).json({ message: 'Document not found' });
        if (!canAccessDocument(req, doc)) return res.status(403).json({ message: 'Access denied' });
        res.status(200).json(doc);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching document', error: error.message });
    }
};

const getByClient = async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.params.clientId !== req.user.id) {
            return res.status(403).json({ message: 'You can only access your own documents' });
        }
        const docs = await Document.find({ client: req.params.clientId })
            .populate('demande')
            .populate('uploaded_by', '-password');
        res.status(200).json(docs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching documents by client', error: error.message });
    }
};

const getByDemande = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
        const docs = await Document.find({ demande: req.params.demandeId })
            .populate('client', '-password')
            .populate('uploaded_by', '-password');
        res.status(200).json(docs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching documents by demande', error: error.message });
    }
};

const create = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
        return res.status(400).json({ message: 'Upload a file using the client document upload route' });
    } catch (error) {
        res.status(500).json({ message: 'Error creating document', error: error.message });
    }
};

const update = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
        return res.status(400).json({ message: 'Document metadata cannot be updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating document', error: error.message });
    }
};

const deleteDocument = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ message: 'Document not found' });
        if (!canAccessDocument(req, doc)) return res.status(403).json({ message: 'Access denied' });
        const filePath = getStoredFilePath(doc.lien);
        try {
            await fs.unlink(filePath);
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }
        await Document.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Document deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting document', error: error.message });
    }
};

const downloadSummaryPDF = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id)
            .populate('client', '-password')
            .populate('uploaded_by', '-password');
        if (!doc) return res.status(404).json({ message: 'Document not found' });
        if (!canAccessDocument(req, doc)) return res.status(403).json({ message: 'Access denied' });

        const filePath = await generateDocumentSummaryPDF({
            document: doc,
            client: doc.client,
            uploaded_by: doc.uploaded_by,
        });
        res.download(filePath);
    } catch (error) {
        res.status(500).json({ message: 'Error generating document summary PDF', error: error.message });
    }
};

const uploadForClient = async (req, res) => {
    try {
        const clientId = req.params.clientId;
        const client = await User.findOne({ _id: clientId, role: 'client' }).select('_id');
        if (!client) return res.status(404).json({ message: 'Client not found' });
        if (!req.file) return res.status(400).json({ message: 'Aucun fichier téléchargé' });

        let demande;
        if (req.body.demande) {
            demande = await DemandeDevis.findOne({ _id: req.body.demande, client: clientId });
            if (!demande) return res.status(404).json({ message: 'Demande non trouvée pour ce client' });
        }

        const doc = await Document.create({
            client: clientId,
            demande: demande?._id,
            nom_fichier: req.file.originalname,
            lien: req.file.path,
            uploaded_by: req.user._id,
            origine: 'admin',
            taille: req.file.size,
            type_mime: req.file.mimetype,
        });
        await Notification.create({
            destinataire: clientId,
            type: 'nouveau_document',
            reference_id: doc._id,
            contenu: `EBI Services vous a envoyé le document « ${doc.nom_fichier} ».`,
        });
        res.status(201).json({ message: 'Document envoyé au client', document: doc });
    } catch (error) {
        res.status(500).json({ message: 'Error uploading document', error: error.message });
    }
};

const download = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ message: 'Document not found' });
        if (!canAccessDocument(req, doc)) return res.status(403).json({ message: 'Access denied' });
        const filePath = getStoredFilePath(doc.lien);
        res.download(filePath, doc.nom_fichier, (error) => {
            if (error && !res.headersSent) {
                res.status(error.code === 'ENOENT' ? 404 : 500).json({ message: 'Document file not found' });
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error downloading document', error: error.message });
    }
};

module.exports = { getAll, getById, getByClient, getByDemande, create, update, delete: deleteDocument, downloadSummaryPDF, uploadForClient, download };
