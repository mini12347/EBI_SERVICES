const FormResponse = require("../models/formResponse");
const Notification = require("../models/notification");
const User = require("../models/utilisateur");
const sendEmail = require("../utils/sendEmail");

exports.createFormResponse = async (req, res) => {
  try {
    const formResponse = new FormResponse(req.body);
    const saved = await formResponse.save();

    // Notify the sales team (all admins) so leads reach the commercial team
    try {
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await Notification.create({
          destinataire: admin._id,
          type: 'nouveau_lead',
          reference_id: saved._id,
          contenu: `Nouveau lead via formulaire de contact : ${saved.name} (${saved.email}) - ${saved.need.substring(0, 60)}`
        }).catch(e => console.error("Admin form lead notification failed:", e.message));
      }
    } catch (e) {
      console.error("Form lead admin notification failed:", e.message);
    }

    // Email the sales/manager team
    await sendEmail({
      to: process.env.MANAGER_EMAIL || process.env.BREVO_SENDER_EMAIL || 'manager@ebiservices.com',
      subject: 'Nouveau lead via formulaire de contact EBI Services',
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
  <div style="background: #1e3a5f; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 20px;">EBI Services - Nouveau Lead</h1>
  </div>
  <div style="padding: 20px; color: #374151;">
    <p>Un nouveau besoin a ete soumis via le formulaire de contact :</p>
    <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0; font-size: 14px;">
      <p><strong>Nom :</strong> ${saved.name}</p>
      <p><strong>Email :</strong> ${saved.email}</p>
      <p><strong>Telephone :</strong> ${saved.phone}</p>
      <p><strong>Besoin :</strong> ${saved.need}</p>
    </div>
    <p>Consultez le dashboard CRM pour traiter ce lead.</p>
  </div>
</div>`
    });

    // Send confirmation email
    await sendEmail({
      to: saved.email,
      subject: 'EBI Services – We received your request',
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
  <div style="background: #1e3a5f; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 20px;">EBI Services</h1>
  </div>
  <div style="padding: 20px; color: #374151;">
    <h2 style="color: #1e3a5f;">Thank you for contacting us, ${saved.name}!</h2>
    <p>We have received your request and our team will get back to you shortly.</p>
    <p><strong>Your request summary:</strong></p>
    <p style="background: #f9fafb; padding: 15px; border-radius: 8px; font-size: 14px;">${saved.need}</p>
    <p>If you have any urgent questions, feel free to contact our support team directly.</p>
    <p style="margin-top: 20px;">Best regards,<br><strong>The EBI Services Team</strong></p>
  </div>
  <div style="background: #f9fafb; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #9ca3af;">
    &copy; ${new Date().getFullYear()} EBI Services. All rights reserved.
  </div>
</div>`
    });

    res.status(201).json(saved);
  } catch (error) {
    console.error("Error creating form response:", error);
    res.status(500).json({ error: "Erreur lors de la création de la réponse." });
  }
};

exports.deleteFormResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await FormResponse.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Réponse non trouvée." });
    }
    res.status(200).json({ message: "Réponse supprimée avec succès." });
  } catch (error) {
    console.error("Error deleting form response:", error);
    res.status(500).json({ error: "Erreur lors de la suppression." });
  }
};

exports.getFormResponsesByUserId = async (req, res) => {
  try {
    const formResponses = await FormResponse.find();
    res.status(200).json(formResponses);
  } catch (error) {
    console.error("Error retrieving form responses:", error);
    res.status(500).json({ error: "Erreur lors de la récupération." });
  }
};

exports.getFormResponsesByFormId = async (req, res) => {
  try {
    const formResponses = await FormResponse.find();
    res.status(200).json(formResponses);
  } catch (error) {
    console.error("Error retrieving form responses:", error);
    res.status(500).json({ error: "Erreur lors de la récupération." });
  }
};

exports.getAllFormResponses = async (req, res) => {
  try {
    const formResponses = await FormResponse.find();
    res.status(200).json(formResponses);
  } catch (error) {
    console.error("Error retrieving form responses:", error);
    res.status(500).json({ error: "Erreur lors de la récupération." });
  }
};
