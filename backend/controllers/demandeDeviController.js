const DemandeDevis = require('../models/demandeDevi');
const sendEmail = require('../utils/sendEmail');

const getAll = async (req, res) => {
    try {
        const demandes = await DemandeDevis.find()
            .populate('client', '-password')
            .populate('service')
            .populate('manager', '-password');
        res.status(200).json(demandes);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching demandes', error: error.message });
    }
};

const getById = async (req, res) => {
    try {
        const demande = await DemandeDevis.findById(req.params.id)
            .populate('client', '-password')
            .populate('service')
            .populate('manager', '-password');
        if (!demande) return res.status(404).json({ message: 'Demande not found' });
        res.status(200).json(demande);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching demande', error: error.message });
    }
};

const getByClient = async (req, res) => {
    try {
        const demandes = await DemandeDevis.find({ client: req.params.clientId })
            .populate('service')
            .populate('manager', '-password');
        res.status(200).json(demandes);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching demandes by client', error: error.message });
    }
};

const create = async (req, res) => {
    try {
        const { client, service, besoin } = req.body;
        
        if (!client || !service || !besoin) {
            return res.status(400).json({ message: 'client, service, and besoin are required' });
        }
        
        if (besoin.trim() === '') {
            return res.status(400).json({ message: 'Besoin cannot be empty' });
        }

        const demande = await DemandeDevis.create({ client, service, besoin });
        
        // Send email to manager
        await sendEmail({
            to: process.env.MANAGER_EMAIL || 'manager@ebiservice.com',
            subject: 'Nouvelle Demande de Devis',
            text: `Une nouvelle demande de devis a été soumise par le client ${client}.`
        });

        res.status(201).json({ message: 'Demande created', demande });
    } catch (error) {
        res.status(500).json({ message: 'Error creating demande', error: error.message });
    }
};

const update = async (req, res) => {
    try {
        const allowedFields = ['statut', 'besoin'];
        const updates = {};
        for (const key of allowedFields) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }
        const demande = await DemandeDevis.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { returnDocument: 'after', runValidators: true }
        );
        if (!demande) return res.status(404).json({ message: 'Demande not found' });
        res.status(200).json({ message: 'Demande updated', demande });
    } catch (error) {
        res.status(500).json({ message: 'Error updating demande', error: error.message });
    }
};

const deleteDemande = async (req, res) => {
    try {
        const demande = await DemandeDevis.findByIdAndDelete(req.params.id);
        if (!demande) return res.status(404).json({ message: 'Demande not found' });
        res.status(200).json({ message: 'Demande deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting demande', error: error.message });
    }
};

const addNote = async (req, res) => {
    const { manager_id, contenu } = req.body;
    try {
        const demande = await DemandeDevis.findById(req.params.id);
        if (demande) {
            demande.notes.push({ manager: manager_id, contenu });
            const updatedDemande = await demande.save();
            res.status(201).json(updatedDemande.notes);
        } else {
            res.status(404).json({ message: 'Demande not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Error adding note', error: error.message });
    }
};

const getNotes = async (req, res) => {
    try {
        const demande = await DemandeDevis.findById(req.params.id).populate('notes.manager', '-password');
        if (demande) {
            res.status(200).json(demande.notes);
        } else {
            res.status(404).json({ message: 'Demande not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notes', error: error.message });
    }
};

module.exports = { getAll, getById, getByClient, create, update, delete: deleteDemande, addNote, getNotes };
