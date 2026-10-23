const Lead = require('../models/lead');
const Notification = require('../models/notification');
const User = require('../models/utilisateur');
const sendEmail = require('../utils/sendEmail');
const { normalizeLeadInput } = require('../utils/leadInput');

exports.createLead = async (req, res) => {
    try {
        const normalized = normalizeLeadInput(req.body);
        if (normalized.errors) {
            return res.status(400).json({
                message: 'Veuillez corriger les informations de votre demande.',
                errors: normalized.errors,
            });
        }

        const lead = await Lead.create(normalized.value);

        try {
            const admins = await User.find({ role: 'admin' });
            await Promise.all(admins.map((admin) => Notification.create({
                destinataire: admin._id,
                type: 'nouveau_lead',
                reference_id: lead._id,
                contenu: `Nouveau lead via ${lead.source}: ${lead.name} (${lead.company}) - ${lead.projectDescription.substring(0, 60)}`,
            })));
        } catch (error) {
            console.error('Admin lead notification failed:', error.message);
        }

        await sendEmail({
            to: process.env.MANAGER_EMAIL || process.env.BREVO_SENDER_EMAIL || 'manager@ebiservices.com',
            subject: `Nouvelle demande EBI Services (${lead.source})`,
            text: [
                `Nouvelle demande via : ${lead.source}`,
                `Nom : ${lead.name}`,
                `Entreprise : ${lead.company}`,
                `E-mail : ${lead.email}`,
                `Téléphone : ${lead.phone || '-'}`,
                `Pays : ${lead.country}`,
                `Besoin : ${lead.projectDescription}`,
                `Budget : ${lead.budget || '-'}`,
                `Échéance : ${lead.deadline || '-'}`,
                `Département suggéré : ${lead.suggestedDepartment}`,
                `Priorité : ${lead.priority}`,
            ].join('\n'),
        });

        await sendEmail({
            to: lead.email,
            subject: 'EBI Services - Nous avons bien reçu votre demande',
            text: `Bonjour ${lead.name},\n\nNous avons bien reçu votre demande et notre équipe vous recontactera.\n\nVotre besoin : ${lead.projectDescription}\n\nL’équipe EBI Services`,
        });

        res.status(201).json({ message: 'Demande enregistrée', lead });
    } catch (error) {
        console.error('Error creating lead:', error);
        res.status(500).json({ message: 'Erreur lors de l’enregistrement de votre demande.' });
    }
};

exports.getAllLeads = async (req, res) => {
    try {
        const leads = await Lead.find().sort({ createdAt: -1 });
        res.status(200).json(leads);
    } catch (error) {
        console.error('Error fetching leads:', error.message);
        res.status(500).json({ error: 'Erreur lors de la recuperation des leads' });
    }
};

exports.updateLead = async (req, res) => {
    try {
        const allowed = ['status', 'priority', 'suggestedDepartment', 'notes'];
        const updates = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }
        const lead = await Lead.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { returnDocument: 'after', runValidators: true }
        );
        if (!lead) return res.status(404).json({ error: 'Lead non trouve' });
        res.status(200).json({ message: 'Lead updated', lead });
    } catch (error) {
        console.error('Error updating lead:', error.message);
        res.status(500).json({ error: 'Erreur lors de la mise a jour du lead' });
    }
};

exports.deleteLead = async (req, res) => {
    try {
        const lead = await Lead.findByIdAndDelete(req.params.id);
        if (!lead) return res.status(404).json({ error: 'Lead non trouve' });
        res.status(200).json({ message: 'Lead supprime' });
    } catch (error) {
        console.error('Error deleting lead:', error.message);
        res.status(500).json({ error: 'Erreur lors de la suppression du lead' });
    }
};
