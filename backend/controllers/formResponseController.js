const { createLead } = require('./leadController');
const FormResponse = require('../models/formResponse');

exports.createFormResponse = (req, res) => {
  const body = req.body || {};
  req.body = {
    ...body,
    projectDescription: body.need,
    source: 'contact_form',
  };
  return createLead(req, res);
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
