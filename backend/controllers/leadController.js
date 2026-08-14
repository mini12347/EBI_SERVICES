const Lead = require('../models/lead');
const Notification = require('../models/notification');
const User = require('../models/utilisateur');
const sendEmail = require('../utils/sendEmail');

exports.createLead = async (req, res) => {
    try {
        const lead = await Lead.create({
            name: req.body.name,
            company: req.body.company || 'Individual',
            email: req.body.email,
            phone: req.body.phone || '',
            country: req.body.country || 'France',
            projectDescription: req.body.projectDescription || '',
            budget: req.body.budget || '',
            deadline: req.body.deadline || '',
            suggestedDepartment: req.body.suggestedDepartment || 'Development',
            priority: req.body.priority || 'medium',
            source: req.body.source || 'chatbot',
            userId: req.body.userId || '',
            notes: req.body.notes || '',
        });

        // Notify every admin (sales team) in the app
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
            await Notification.create({
                destinataire: admin._id,
                type: 'nouveau_lead',
                reference_id: lead._id,
                contenu: `Nouveau lead via ${lead.source}: ${lead.name} (${lead.company}) - ${lead.projectDescription.substring(0, 60)}`
            }).catch(e => console.error("Admin lead notification failed:", e.message));
        }

        // Email the sales/manager team
        await sendEmail({
            to: process.env.MANAGER_EMAIL || process.env.BREVO_SENDER_EMAIL || 'manager@ebiservices.com',
            subject: 'Nouveau lead Chatbot EBI Services',
            html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
  <div style="background: #1e3a5f; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 20px;">EBI Services - Nouveau Lead</h1>
  </div>
  <div style="padding: 20px; color: #374151;">
    <p>Un nouveau besoin a ete collecte par le chatbot :</p>
    <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0; font-size: 14px;">
      <p><strong>Nom :</strong> ${lead.name}</p>
      <p><strong>Societe :</strong> ${lead.company}</p>
      <p><strong>Email :</strong> ${lead.email}</p>
      <p><strong>Telephone :</strong> ${lead.phone || '-'}</p>
      <p><strong>Pays :</strong> ${lead.country}</p>
      <p><strong>Besoin :</strong> ${lead.projectDescription}</p>
      <p><strong>Budget :</strong> ${lead.budget || '-'}</p>
      <p><strong>Deadline :</strong> ${lead.deadline || '-'}</p>
      <p><strong>Departement suggere :</strong> ${lead.suggestedDepartment}</p>
      <p><strong>Priorite :</strong> ${lead.priority}</p>
    </div>
    <p>Consultez le dashboard CRM pour traiter ce lead.</p>
  </div>
</div>`
        });

        // Confirmation email to the prospect
        await sendEmail({
            to: lead.email,
            subject: 'EBI Services - Nous avons bien recu votre demande',
            html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
  <div style="background: #1e3a5f; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 20px;">EBI Services</h1>
  </div>
  <div style="padding: 20px; color: #374151;">
    <h2 style="color: #1e3a5f;">Merci ${lead.name} !</h2>
    <p>Nous avons bien recu votre demande et notre equipe commerciale va vous recontacter rapidement.</p>
    <p style="background: #f9fafb; padding: 15px; border-radius: 8px; font-size: 14px;"><strong>Votre besoin :</strong> ${lead.projectDescription}</p>
  </div>
</div>`
        });

        res.status(201).json({ message: 'Lead created', lead });
    } catch (error) {
        console.error('Error creating lead:', error.message);
        res.status(500).json({ error: 'Erreur lors de la creation du lead' });
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
