const Devis = require('../models/devi');
const DemandeDevis = require('../models/demandeDevi');
const sendEmail = require('../utils/sendEmail');
const { generateQuotePDF } = require('../utils/pdfGenerator');
const fs = require('fs');
const path = require('path');

const canAccessQuote = async (devis, user) => {
    if (user.role === 'admin') return true;
    const demandeId = devis.demande?._id || devis.demande;
    const demande = await DemandeDevis.findById(demandeId).select('client');
    return demande && demande.client.toString() === user.id;
};

const getAll = async (req, res) => {
    try {
        let filter = {};
        if (req.user.role !== 'admin') {
            const demandes = await DemandeDevis.find({ client: req.user._id }).select('_id');
            filter = { demande: { $in: demandes.map((demande) => demande._id) } };
        }
        const devis = await Devis.find(filter).populate('demande');
        res.status(200).json(devis);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching devis', error: error.message });
    }
};

const getById = async (req, res) => {
    try {
        const devis = await Devis.findById(req.params.id).populate('demande');
        if (!devis) return res.status(404).json({ message: 'Devis not found' });
        if (!await canAccessQuote(devis, req.user)) {
            return res.status(403).json({ message: 'You can only access your own quotes' });
        }
        res.status(200).json(devis);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching devis', error: error.message });
    }
};

const getByDemande = async (req, res) => {
    try {
        const demande = await DemandeDevis.findById(req.params.demandeId).select('client');
        if (!demande) return res.status(404).json({ message: 'Demande not found' });
        if (req.user.role !== 'admin' && demande.client.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You can only access your own quotes' });
        }
        const devis = await Devis.find({ demande: req.params.demandeId });
        res.status(200).json(devis);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching devis by demande', error: error.message });
    }
};

const create = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can create quotes' });
        }
        const { demande, fichier_pdf, montant, terms } = req.body;
        if (!demande || !Number.isFinite(Number(montant)) || Number(montant) <= 0) {
            return res.status(400).json({ message: 'A request and a positive quote amount are required' });
        }

        const demandeDoc = await DemandeDevis.findById(demande)
            .populate('client')
            .populate('service');
        if (!demandeDoc) return res.status(404).json({ message: 'Demande not found' });

        if (fichier_pdf) {
            const devis = await Devis.create({ demande, fichier_pdf, montant, terms });
            await DemandeDevis.findByIdAndUpdate(demande, { statut: 'devis_envoye' });
            return res.status(201).json({ message: 'Devis created', devis });
        }

        // Auto-generate the quote PDF if none was uploaded
        const devis = await Devis.create({ demande, fichier_pdf: 'pending', montant, terms });
        try {
            const pdfPath = await generateQuotePDF({
                devis,
                demande: demandeDoc,
                client: demandeDoc.client,
                service: demandeDoc.service,
                terms,
            });
            devis.fichier_pdf = pdfPath;
            await devis.save();
        } catch (error) {
            await Devis.findByIdAndDelete(devis._id);
            throw error;
        }

        await DemandeDevis.findByIdAndUpdate(demande, { statut: 'devis_envoye' });
        res.status(201).json({ message: 'Devis created', devis });
    } catch (error) {
        res.status(500).json({ message: 'Error creating devis', error: error.message });
    }
};

const update = async (req, res) => {
    try {
        const existing = await Devis.findById(req.params.id);
        if (!existing) return res.status(404).json({ message: 'Devis not found' });
        if (!await canAccessQuote(existing, req.user)) {
            return res.status(403).json({ message: 'You can only update your own quotes' });
        }
        if (req.user.role !== 'admin' &&
            (Object.keys(req.body).some((key) => key !== 'statut') ||
                !['accepte', 'refuse'].includes(req.body.statut))) {
            return res.status(403).json({ message: 'Clients can only accept or reject their own quotes' });
        }

        const allowedFields = ['montant', 'statut', 'fichier_pdf'];
        const updates = {};
        for (const key of allowedFields) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }
        const devis = await Devis.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { returnDocument: 'after', runValidators: true }
        );
        if (!devis) return res.status(404).json({ message: 'Devis not found' });
        if (updates.statut === 'accepte' || updates.statut === 'refuse') {
            await DemandeDevis.findByIdAndUpdate(devis.demande, { statut: updates.statut });
        }
        res.status(200).json({ message: 'Devis updated', devis });
    } catch (error) {
        res.status(500).json({ message: 'Error updating devis', error: error.message });
    }
};

const deleteDevis = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can delete quotes' });
        }
        const devis = await Devis.findByIdAndDelete(req.params.id);
        if (!devis) return res.status(404).json({ message: 'Devis not found' });
        res.status(200).json({ message: 'Devis deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting devis', error: error.message });
    }
};

const uploadQuotePDF = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can issue quotes' });
        }
        const { demande, montant, client_email, terms } = req.body;

        let pdfPath = req.file ? req.file.path : null;

        if (!pdfPath) {
            // No file uploaded — auto-generate the quote PDF
            const demandeDoc = await DemandeDevis.findById(demande)
                .populate('client')
                .populate('service');
            const devisTmp = await Devis.create({ demande, fichier_pdf: 'pending', montant });
            pdfPath = await generateQuotePDF({
                devis: devisTmp,
                demande: demandeDoc,
                client: demandeDoc ? demandeDoc.client : null,
                service: demandeDoc ? demandeDoc.service : null,
                terms,
            });
            devisTmp.fichier_pdf = pdfPath;
            await devisTmp.save();
        }
        
        const devis = await Devis.create({ 
            demande, 
            fichier_pdf: pdfPath, 
            montant 
        });

        const updatedDemande = await DemandeDevis.findByIdAndUpdate(
            demande,
            { statut: 'devis_envoye' },
            { returnDocument: 'after' }
        );

        await sendEmail({
            to: client_email || 'client@ebiservice.com',
            subject: 'Votre devis est prêt',
            text: 'Votre devis personnalisé a été généré et vous a été envoyé.'
        });

        res.status(201).json({ message: 'Devis uploaded successfully', devis, demande: updatedDemande });
    } catch (error) {
        res.status(500).json({ message: 'Error uploading devis PDF', error: error.message });
    }
};

const downloadQuotePDF = async (req, res) => {
    try {
        const devis = await Devis.findById(req.params.id);
        if (devis && !await canAccessQuote(devis, req.user)) {
            return res.status(403).json({ message: 'You can only download your own quotes' });
        }
        if (devis && devis.fichier_pdf) {
            const filePath = path.resolve(devis.fichier_pdf);
            if (fs.existsSync(filePath)) {
                res.download(filePath);
            } else {
                res.status(404).json({ message: 'File not found on server' });
            }
        } else {
            res.status(404).json({ message: 'Devis not found or has no PDF' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error downloading devis', error: error.message });
    }
};

module.exports = { getAll, getById, getByDemande, create, update, delete: deleteDevis, uploadQuotePDF, downloadQuotePDF };
