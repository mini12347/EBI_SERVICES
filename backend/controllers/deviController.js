const Devis = require('../models/devi');
const DemandeDevis = require('../models/demandeDevi');
const sendEmail = require('../utils/sendEmail');
const { generateQuotePDF } = require('../utils/pdfGenerator');
const fs = require('fs');
const path = require('path');

const getAll = async (req, res) => {
    try {
        const devis = await Devis.find().populate('demande');
        res.status(200).json(devis);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching devis', error: error.message });
    }
};

const getById = async (req, res) => {
    try {
        const devis = await Devis.findById(req.params.id).populate('demande');
        if (!devis) return res.status(404).json({ message: 'Devis not found' });
        res.status(200).json(devis);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching devis', error: error.message });
    }
};

const getByDemande = async (req, res) => {
    try {
        const devis = await Devis.find({ demande: req.params.demandeId });
        res.status(200).json(devis);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching devis by demande', error: error.message });
    }
};

const create = async (req, res) => {
    try {
        const { demande, fichier_pdf, montant, terms } = req.body;

        if (fichier_pdf) {
            const devis = await Devis.create({ demande, fichier_pdf, montant });
            return res.status(201).json({ message: 'Devis created', devis });
        }

        // Auto-generate the quote PDF if none was uploaded
        const demandeDoc = await DemandeDevis.findById(demande)
            .populate('client')
            .populate('service');

        const devis = await Devis.create({ demande, fichier_pdf: 'pending', montant });
        const pdfPath = await generateQuotePDF({
            devis,
            demande: demandeDoc,
            client: demandeDoc ? demandeDoc.client : null,
            service: demandeDoc ? demandeDoc.service : null,
            terms,
        });
        devis.fichier_pdf = pdfPath;
        await devis.save();

        res.status(201).json({ message: 'Devis created', devis });
    } catch (error) {
        res.status(500).json({ message: 'Error creating devis', error: error.message });
    }
};

const update = async (req, res) => {
    try {
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
        res.status(200).json({ message: 'Devis updated', devis });
    } catch (error) {
        res.status(500).json({ message: 'Error updating devis', error: error.message });
    }
};

const deleteDevis = async (req, res) => {
    try {
        const devis = await Devis.findByIdAndDelete(req.params.id);
        if (!devis) return res.status(404).json({ message: 'Devis not found' });
        res.status(200).json({ message: 'Devis deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting devis', error: error.message });
    }
};

const uploadQuotePDF = async (req, res) => {
    try {
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
