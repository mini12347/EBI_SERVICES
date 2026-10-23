const assert = require('node:assert/strict');
const test = require('node:test');

const Document = require('../models/document');
const Notification = require('../models/notification');
const User = require('../models/utilisateur');
const documentController = require('../controllers/documentController');

const findById = Document.findById;
const find = Document.find;
const createDocument = Document.create;
const findOneUser = User.findOne;
const createNotification = Notification.create;

test.after(() => {
    Document.findById = findById;
    Document.find = find;
    Document.create = createDocument;
    User.findOne = findOneUser;
    Notification.create = createNotification;
});

test('a client cannot list another client’s documents', async () => {
    let queried = false;
    Document.find = () => {
        queried = true;
        return [];
    };
    let responseStatus;
    let responseBody;

    await documentController.getByClient(
        { user: { id: 'client-a', role: 'client' }, params: { clientId: 'client-b' } },
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
    assert.equal(responseBody.message, 'You can only access your own documents');
    assert.equal(queried, false);
});

test('a client cannot download another client’s document', async () => {
    let downloaded = false;
    Document.findById = async () => ({ client: 'client-b', lien: 'document-file.pdf' });
    let responseStatus;

    await documentController.download(
        { user: { id: 'client-a', role: 'client' }, params: { id: 'document-id' } },
        {
            status(code) {
                responseStatus = code;
                return this;
            },
            json() {
                return this;
            },
            download() {
                downloaded = true;
            },
        },
    );

    assert.equal(responseStatus, 403);
    assert.equal(downloaded, false);
});

test('admin uploads a document into the selected client vault and notifies the client', async () => {
    let savedDocument;
    let savedNotification;
    User.findOne = () => ({ select: async () => ({ _id: 'client-id' }) });
    Document.create = async (document) => {
        savedDocument = { ...document, _id: 'document-id' };
        return savedDocument;
    };
    Notification.create = async (notification) => {
        savedNotification = notification;
    };
    let responseStatus;
    let responseBody;

    await documentController.uploadForClient(
        {
            params: { clientId: 'client-id' },
            body: {},
            file: {
                originalname: 'proposal.pdf',
                path: 'C:\\uploads\\document-1.pdf',
                size: 1024,
                mimetype: 'application/pdf',
            },
            user: { _id: 'admin-id', role: 'admin' },
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

    assert.equal(responseStatus, 201);
    assert.equal(savedDocument.client, 'client-id');
    assert.equal(savedDocument.uploaded_by, 'admin-id');
    assert.equal(savedDocument.origine, 'admin');
    assert.equal(savedNotification.destinataire, 'client-id');
    assert.equal(savedNotification.reference_id, 'document-id');
    assert.equal(responseBody.document._id, 'document-id');
});
