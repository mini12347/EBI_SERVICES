const assert = require('node:assert/strict');
const test = require('node:test');

const Message = require('../models/message');
const User = require('../models/utilisateur');
const Notification = require('../models/notification');
const messageController = require('../controllers/messageController');

const messageCreate = Message.create;
const messageFind = Message.find;
const userFind = User.find;
const notificationInsertMany = Notification.insertMany;

test.after(() => {
    Message.create = messageCreate;
    Message.find = messageFind;
    User.find = userFind;
    Notification.insertMany = notificationInsertMany;
});

test('a client cannot read another client’s conversation', async () => {
    let queried = false;
    Message.find = () => {
        queried = true;
        return [];
    };
    let responseStatus;
    let responseBody;

    await messageController.getByClient(
        { user: { id: 'client-a', role: 'client' }, params: { clientId: 'client-b' }, query: {} },
        {
            status(code) {
                responseStatus = code;
                return this;
            },
            json(body) {
                responseBody = body;
                return this;
            },
        },
    );

    assert.equal(responseStatus, 403);
    assert.equal(responseBody.message, 'You can only access your own messages');
    assert.equal(queried, false);
});

test('a client cannot send a message as another client', async () => {
    let created = false;
    Message.create = async () => {
        created = true;
    };
    let responseStatus;
    let responseBody;

    await messageController.create(
        {
            user: { _id: 'client-a', id: 'client-a', role: 'client', fullname: 'Client A' },
            body: { client: 'client-b', contenu: 'Private message', departement: 'general' },
        },
        {
            status(code) {
                responseStatus = code;
                return this;
            },
            json(body) {
                responseBody = body;
                return this;
            },
        },
    );

    assert.equal(responseStatus, 403);
    assert.equal(responseBody.message, 'You can only send messages in your own conversation');
    assert.equal(created, false);
});

test('message content and department are validated before saving', async () => {
    let created = false;
    Message.create = async () => {
        created = true;
    };
    let responseStatus;

    await messageController.create(
        {
            user: { _id: 'client-a', id: 'client-a', role: 'client', fullname: 'Client A' },
            body: { client: 'client-a', contenu: ' ', departement: 'unknown' },
        },
        {
            status(code) {
                responseStatus = code;
                return this;
            },
            json() {
                return this;
            },
        },
    );

    assert.equal(responseStatus, 400);
    assert.equal(created, false);
});

test('a client message is stored under the authenticated sender and notifies admins', async () => {
    let savedMessage;
    let savedNotifications;
    Message.create = async (message) => {
        savedMessage = { ...message, _id: 'message-id' };
        return savedMessage;
    };
    User.find = () => ({ select: async () => [{ _id: 'admin-id' }] });
    Notification.insertMany = async (notifications) => {
        savedNotifications = notifications;
    };
    let responseStatus;

    await messageController.create(
        {
            user: { _id: 'client-a', id: 'client-a', role: 'client', fullname: 'Client A' },
            body: {
                client: 'client-a',
                expediteur: 'admin-id',
                contenu: 'Please send me an update',
                departement: 'development',
            },
        },
        {
            status(code) {
                responseStatus = code;
                return this;
            },
            json() {
                return this;
            },
        },
    );

    assert.equal(responseStatus, 201);
    assert.equal(savedMessage.expediteur, 'client-a');
    assert.equal(savedMessage.departement, 'development');
    assert.equal(savedNotifications.length, 1);
    assert.equal(savedNotifications[0].destinataire, 'admin-id');
});
