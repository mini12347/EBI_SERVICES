const DemandeDevis = require('../models/demandeDevi');
const Service = require('../models/service');
const Utilisateur = require('../models/utilisateur');
const serviceCatalog = require('../data/serviceCatalog');
const sendEmail = require('../utils/sendEmail');
const mongoose = require('mongoose');

const getAll = async (req, res) => {
    try {
        const filter = req.user.role === 'admin' ? {} : { client: req.user._id };
        const demandes = await DemandeDevis.find(filter)
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
        if (req.user.role !== 'admin' && demande.client._id.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You can only access your own requests' });
        }
        res.status(200).json(demande);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching demande', error: error.message });
    }
};

const getByClient = async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.params.clientId !== req.user.id) {
            return res.status(403).json({ message: 'You can only access your own requests' });
        }
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
        const { service: serviceCode, besoin, secteur, budget, delai } = req.body;
        
        if (req.user.role !== 'client') {
            return res.status(403).json({ message: 'Only clients can submit quote requests' });
        }
        
        if (typeof besoin !== 'string' || besoin.trim() === '' || !serviceCode) {
            return res.status(400).json({ message: 'Besoin cannot be empty' });
        }

        const catalogService = serviceCatalog.find((item) => item.code === serviceCode);
        if (!catalogService) {
            return res.status(400).json({ message: 'Unknown service selection' });
        }

        const service = await Service.findOneAndUpdate(
            { code: catalogService.code },
            { $setOnInsert: catalogService, $set: { actif: true } },
            { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
        );
        const demande = await DemandeDevis.create({
            client: req.user._id,
            service: service._id,
            besoin: besoin.trim(),
            secteur,
            budget,
            delai,
        });
        
        // Send email to manager
        await sendEmail({
            to: process.env.MANAGER_EMAIL || 'manager@ebiservice.com',
            subject: 'Nouvelle Demande de Devis',
            text: `Une nouvelle demande de devis a été soumise par le client ${req.user.fullname}.`
        });

        await demande.populate(['client', 'service']);
        res.status(201).json({ message: 'Demande created', demande });
    } catch (error) {
        res.status(500).json({ message: 'Error creating demande', error: error.message });
    }
};

const update = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can update quote requests' });
        }
        const allowedFields = ['statut', 'besoin'];
        const updates = {};
        for (const key of allowedFields) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }

        if (req.body.manager !== undefined) {
            if (req.body.manager === null || req.body.manager === '') {
                updates.manager = null;
            } else {
                if (
                    typeof req.body.manager !== 'string'
                    || !mongoose.Types.ObjectId.isValid(req.body.manager)
                ) {
                    return res.status(400).json({ message: 'Invalid manager ID' });
                }
                const manager = await Utilisateur.findById(req.body.manager);
                if (!manager || manager.role !== 'admin') {
                    return res.status(400).json({ message: 'Manager must be an existing admin' });
                }
                updates.manager = manager._id;
            }
        }

        if (req.body.archive !== undefined) {
            if (typeof req.body.archive !== 'boolean') {
                return res.status(400).json({ message: 'Archive must be a boolean' });
            }
            updates.archivedAt = req.body.archive ? new Date() : null;
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
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can delete quote requests' });
        }
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
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can add manager notes' });
        }
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
        const demande = await DemandeDevis.findById(req.params.id)
            .populate('client', '-password')
            .populate('notes.manager', '-password');
        if (demande) {
            if (req.user.role !== 'admin' && demande.client._id.toString() !== req.user.id) {
                return res.status(403).json({ message: 'You can only access your own request notes' });
            }
            res.status(200).json(demande.notes);
        } else {
            res.status(404).json({ message: 'Demande not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notes', error: error.message });
    }
};

module.exports = { getAll, getById, getByClient, create, update, delete: deleteDemande, addNote, getNotes };
