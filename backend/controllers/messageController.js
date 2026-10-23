const Message = require('../models/message');
const User = require('../models/utilisateur');
const Notification = require('../models/notification');
const departments = new Set(['general', 'development', 'recruitment', 'teleservices', 'bpo']);

const getAll = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        const messages = await Message.find()
            .populate('client', '-password')
            .populate('expediteur', '-password')
            .sort({ createdAt: 1 });
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
        const clientId = message.client?._id?.toString() || message.client?.toString();
        if (req.user.role !== 'admin' && clientId !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }
        res.status(200).json(message);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching message', error: error.message });
    }
};

const getByClient = async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.params.clientId !== req.user.id) {
            return res.status(403).json({ message: 'You can only access your own messages' });
        }
        const filter = { client: req.params.clientId };
        if (req.query.departement) {
            if (!departments.has(req.query.departement)) {
                return res.status(400).json({ message: 'Invalid department' });
            }
            filter.departement = req.query.departement === 'general'
                ? { $in: ['general', null] }
                : req.query.departement;
        }
        const messages = await Message.find(filter)
            .populate('client', '-password')
            .populate('expediteur', '-password')
            .sort({ createdAt: 1 });
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages by client', error: error.message });
    }
};

const create = async (req, res) => {
    try {
        const { client, contenu } = req.body;
        const departement = req.body.departement || 'general';
        if (!client || typeof client !== 'string') {
            return res.status(400).json({ message: 'A valid client is required' });
        }
        if (typeof contenu !== 'string' || !contenu.trim()) {
            return res.status(400).json({ message: 'Message content is required' });
        }
        if (contenu.trim().length > 5000) {
            return res.status(400).json({ message: 'Message must be 5000 characters or fewer' });
        }
        if (!departments.has(departement)) {
            return res.status(400).json({ message: 'Invalid department' });
        }
        if (req.user.role === 'client' && client !== req.user.id) {
            return res.status(403).json({ message: 'You can only send messages in your own conversation' });
        }
        if (req.user.role === 'admin') {
            const recipient = await User.findOne({ _id: client, role: 'client' }).select('_id');
            if (!recipient) return res.status(404).json({ message: 'Client not found' });
        }

        const message = await Message.create({
            client,
            expediteur: req.user._id,
            contenu: contenu.trim(),
            departement,
        });
        try {
            if (req.user.role === 'admin') {
                await Notification.create({
                    destinataire: client,
                    type: 'nouveau_message',
                    reference_id: message._id,
                    contenu: `Vous avez un nouveau message de l'administration : "${contenu.trim().slice(0, 40)}"`,
                });
            } else {
                const admins = await User.find({ role: 'admin' }).select('_id');
                if (admins.length) {
                    await Notification.insertMany(admins.map(({ _id }) => ({
                        destinataire: _id,
                        type: 'nouveau_message',
                        reference_id: message._id,
                        contenu: `Nouveau message de ${req.user.fullname} : "${contenu.trim().slice(0, 40)}"`,
                    })));
                }
            }
        } catch (notificationError) {
            console.error('Message notification failed:', notificationError.message);
        }
        res.status(201).json({ message: 'Message created', createdMessage: message });
    } catch (error) {
        res.status(500).json({ message: 'Error creating message', error: error.message });
    }
};

const markAsLu = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) return res.status(404).json({ message: 'Message not found' });
        const clientId = message.client.toString();
        if (req.user.role !== 'admin' && clientId !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }
        const updatedMessage = await Message.findByIdAndUpdate(
            req.params.id,
            { $set: { lu: true } },
            { returnDocument: 'after' }
        );
        res.status(200).json({ message: 'Message marked as read', data: updatedMessage });
    } catch (error) {
        res.status(500).json({ message: 'Error updating message', error: error.message });
    }
};

const deleteMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) return res.status(404).json({ message: 'Message not found' });
        const clientId = message.client.toString();
        if (req.user.role !== 'admin' && clientId !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }
        await Message.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Message deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting message', error: error.message });
    }
};

module.exports = { getAll, getById, getByClient, create, markAsLu, delete: deleteMessage };
