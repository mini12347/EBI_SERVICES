const assert = require('node:assert/strict');
const test = require('node:test');
const serviceCatalog = require('../data/serviceCatalog');

const Service = require('../models/service');
const DemandeDevis = require('../models/demandeDevi');
const Devis = require('../models/devi');
const Utilisateur = require('../models/utilisateur');

const serviceFindOneAndUpdate = Service.findOneAndUpdate;
const demandeCreate = DemandeDevis.create;
const demandeFindById = DemandeDevis.findById;
const demandeFindByIdAndUpdate = DemandeDevis.findByIdAndUpdate;
const utilisateurFindById = Utilisateur.findById;
const devisFindById = Devis.findById;
const devisFindByIdAndUpdate = Devis.findByIdAndUpdate;

const sendEmailPath = require.resolve('../utils/sendEmail');
require.cache[sendEmailPath] = {
    id: sendEmailPath,
    filename: sendEmailPath,
    loaded: true,
    exports: async () => true,
};

const demandeController = require('../controllers/demandeDeviController');
const devisController = require('../controllers/deviController');

test.after(() => {
    Service.findOneAndUpdate = serviceFindOneAndUpdate;
    DemandeDevis.create = demandeCreate;
    DemandeDevis.findById = demandeFindById;
    DemandeDevis.findByIdAndUpdate = demandeFindByIdAndUpdate;
    Utilisateur.findById = utilisateurFindById;
    Devis.findById = devisFindById;
    Devis.findByIdAndUpdate = devisFindByIdAndUpdate;
    delete require.cache[sendEmailPath];
});

test('client quote request uses the authenticated client and the selected catalog service', async () => {
    const clientId = 'client-id';
    const service = serviceCatalog[0];
    let savedRequest;
    let responseStatus;
    let responseBody;

    Service.findOneAndUpdate = async (filter, update) => {
        assert.deepEqual(filter, { code: service.code });
        assert.equal(update.$set.actif, true);
        return { _id: 'service-id' };
    };
    DemandeDevis.create = async (request) => {
        savedRequest = request;
        return {
            ...request,
            _id: 'request-id',
            populate: async function () {
                return this;
            },
        };
    };

    await demandeController.create(
        {
            user: { _id: clientId, id: clientId, fullname: 'Test Client', role: 'client' },
            body: {
                client: 'another-client',
                service: service.code,
                secteur: 'Technology',
                budget: '€10,000 - €25,000',
                delai: '3 Months',
                besoin: 'Build a customer portal',
            },
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
    assert.equal(savedRequest.client, clientId);
    assert.equal(savedRequest.service, 'service-id');
    assert.equal(savedRequest.besoin, 'Build a customer portal');
    assert.equal(savedRequest.budget, '€10,000 - €25,000');
    assert.equal(responseBody.demande._id, 'request-id');
});

test('client can accept only their own quote and the request status is synchronized', async () => {
    const clientId = 'client-id';
    const demandeId = 'request-id';
    let quoteUpdate;
    let demandeUpdate;
    let responseStatus;
    let responseBody;

    Devis.findById = async () => ({ demande: demandeId });
    DemandeDevis.findById = () => ({
        select: async () => ({ client: { toString: () => clientId } }),
    });
    Devis.findByIdAndUpdate = async (id, update) => {
        quoteUpdate = { id, update };
        return { _id: id, demande: demandeId, statut: update.$set.statut };
    };
    DemandeDevis.findByIdAndUpdate = async (id, update) => {
        demandeUpdate = { id, update };
    };

    await devisController.update(
        {
            params: { id: 'quote-id' },
            user: { id: clientId, role: 'client' },
            body: { statut: 'accepte' },
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

    assert.equal(responseStatus, 200);
    assert.equal(quoteUpdate.id, 'quote-id');
    assert.deepEqual(quoteUpdate.update, { $set: { statut: 'accepte' } });
    assert.deepEqual(demandeUpdate, { id: demandeId, update: { statut: 'accepte' } });
    assert.equal(responseBody.devis.statut, 'accepte');
});

test('admin can assign a quote request only to an existing admin and clear its assignment', async () => {
    const managerId = '64b000000000000000000001';
    let savedUpdates;
    let responseStatus;

    Utilisateur.findById = async (id) => (
        id === managerId ? { _id: managerId, role: 'admin' } : null
    );
    DemandeDevis.findByIdAndUpdate = async (id, update) => {
        savedUpdates = update.$set;
        return { _id: id, ...savedUpdates };
    };

    const makeResponse = () => ({
        status(code) {
            responseStatus = code;
            return this;
        },
        json() {
            return this;
        },
    });

    await demandeController.update(
        { params: { id: 'request-id' }, user: { role: 'admin' }, body: { manager: managerId } },
        makeResponse(),
    );
    assert.equal(responseStatus, 200);
    assert.deepEqual(savedUpdates, { manager: managerId });

    await demandeController.update(
        { params: { id: 'request-id' }, user: { role: 'admin' }, body: { manager: null } },
        makeResponse(),
    );
    assert.equal(responseStatus, 200);
    assert.deepEqual(savedUpdates, { manager: null });
});

test('admin can archive and restore a quote request without deleting it', async () => {
    let savedUpdates;
    let responseStatus;
    DemandeDevis.findByIdAndUpdate = async (id, update) => {
        savedUpdates = update.$set;
        return { _id: id, ...savedUpdates };
    };
    const makeResponse = () => ({
        status(code) {
            responseStatus = code;
            return this;
        },
        json() {
            return this;
        },
    });

    await demandeController.update(
        { params: { id: 'request-id' }, user: { role: 'admin' }, body: { archive: true } },
        makeResponse(),
    );
    assert.equal(responseStatus, 200);
    assert.ok(savedUpdates.archivedAt instanceof Date);

    await demandeController.update(
        { params: { id: 'request-id' }, user: { role: 'admin' }, body: { archive: false } },
        makeResponse(),
    );
    assert.equal(responseStatus, 200);
    assert.deepEqual(savedUpdates, { archivedAt: null });
});

test('admin cannot assign quote requests to non-admin or invalid users', async () => {
    let responseStatus;
    let requestUpdated = false;
    Utilisateur.findById = async () => ({ role: 'client' });
    DemandeDevis.findByIdAndUpdate = async () => {
        requestUpdated = true;
    };

    await demandeController.update(
        {
            params: { id: 'request-id' },
            user: { role: 'admin' },
            body: { manager: '64b000000000000000000002' },
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
    assert.equal(requestUpdated, false);

    await demandeController.update(
        { params: { id: 'request-id' }, user: { role: 'admin' }, body: { manager: 'not-an-id' } },
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
    assert.equal(requestUpdated, false);
});
