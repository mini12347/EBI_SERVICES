const Message = require('../models/message');

const getAll = async (req, res) => {
    try {
        const messages = await Message.find()
            .populate('client', '-password')
            .populate('expediteur', '-password');
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages', error: error.message });
    }
};

const getById = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id)
            .populate('client', '-password')
            .populate('expediteur', '-password');
        if (!message) return res.status(404).json({ message: 'Message not found' });
        res.status(200).json(message);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching message', error: error.message });
    }
};

const getByClient = async (req, res) => {
    try {
        const messages = await Message.find({ client: req.params.clientId })
            .populate('expediteur', '-password');
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages by client', error: error.message });
    }
};

const sendEmail = require('../utils/sendEmail');
const Notification = require('../models/notification');
const User = require('../models/utilisateur');

const create = async (req, res) => {
    try {
        const { client, expediteur, contenu, client_email } = req.body;
        const message = await Message.create({ client, expediteur, contenu });
        
        if (expediteur.toString() !== client.toString()) {
            await sendEmail({
                to: client_email || 'client@ebiservice.com',
                subject: 'Nouveau message concernant votre devis',
                text: `Vous avez un nouveau message : ${contenu}`
            });
            // Create notification for client
            await Notification.create({
                destinataire: client,
                type: 'nouveau_message',
                reference_id: message._id,
                contenu: `Vous avez un nouveau message de l'administration : "${contenu.substring(0, 40)}..."`
            }).catch(e => console.error("Client notification failed:", e.message));
        } else {
            // Client sent to admin
            const admins = await User.find({ role: 'admin' });
            for (const admin of admins) {
                await Notification.create({
                    destinataire: admin._id,
                    type: 'nouveau_message',
                    reference_id: message._id,
                    contenu: `Nouveau message d'un client: "${contenu.substring(0, 40)}..."`
                }).catch(e => console.error("Admin notification failed:", e.message));
            }
        }

        res.status(201).json({ message: 'Message created', createdMessage: message });
    } catch (error) {
        res.status(500).json({ message: 'Error creating message', error: error.message });
    }
};

const markAsLu = async (req, res) => {
    try {
        const message = await Message.findByIdAndUpdate(
            req.params.id,
            { $set: { lu: true } },
            { returnDocument: 'after' }
        );
        if (!message) return res.status(404).json({ message: 'Message not found' });
        res.status(200).json({ message: 'Message marked as read', data: message });
    } catch (error) {
        res.status(500).json({ message: 'Error updating message', error: error.message });
    }
};

const deleteMessage = async (req, res) => {
    try {
        const message = await Message.findByIdAndDelete(req.params.id);
        if (!message) return res.status(404).json({ message: 'Message not found' });
        res.status(200).json({ message: 'Message deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting message', error: error.message });
    }
};

module.exports = { getAll, getById, getByClient, create, markAsLu, delete: deleteMessage };
