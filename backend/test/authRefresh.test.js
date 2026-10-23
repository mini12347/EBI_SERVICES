const assert = require('node:assert/strict');
const test = require('node:test');

const jwt = require('jsonwebtoken');
const User = require('../models/utilisateur');
const Token = require('../models/jwt_tokens');
const authController = require('../controllers/authController');

const originalJwtVerify = jwt.verify;
const originalJwtSign = jwt.sign;
const originalUserFindById = User.findById;
const originalTokenFindOne = Token.findOne;
const originalTokenFindOneAndUpdate = Token.findOneAndUpdate;
const originalTokenCreate = Token.create;
const originalDbConnected = global.__dbConnected;

test.after(() => {
    jwt.verify = originalJwtVerify;
    jwt.sign = originalJwtSign;
    User.findById = originalUserFindById;
    Token.findOne = originalTokenFindOne;
    Token.findOneAndUpdate = originalTokenFindOneAndUpdate;
    Token.create = originalTokenCreate;
    global.__dbConnected = originalDbConnected;
});

test('refresh rotates a valid refresh token and returns a new token pair', async () => {
    global.__dbConnected = true;
    let revokedFilter;
    let createdToken;
    let tokenCount = 0;
    jwt.verify = () => ({ id: 'user-id' });
    jwt.sign = () => (++tokenCount === 1 ? 'new-access-token' : 'new-refresh-token');
    Token.findOne = async (filter) => {
        assert.deepEqual(filter, {
            refresh_token: 'old-refresh-token',
            utilisateur: 'user-id',
            actif: true,
        });
        return { _id: 'old-token-id' };
    };
    User.findById = async () => ({ _id: 'user-id' });
    Token.findOneAndUpdate = async (filter) => {
        revokedFilter = filter;
        return { _id: 'old-token-id', actif: false };
    };
    Token.create = async (token) => {
        createdToken = token;
    };
    let status;
    let payload;

    await authController.refresh(
        { body: { refresh_token: 'old-refresh-token' } },
        {
            status(code) {
                status = code;
                return this;
            },
            json(body) {
                payload = body;
                return this;
            },
        },
    );

    assert.equal(status, 200);
    assert.deepEqual(payload, {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
    });
    assert.deepEqual(revokedFilter, { _id: 'old-token-id', actif: true });
    assert.equal(createdToken.utilisateur, 'user-id');
    assert.equal(createdToken.actif, true);
});

test('refresh rejects an invalid or expired refresh token', async () => {
    global.__dbConnected = true;
    jwt.verify = () => {
        throw new Error('jwt expired');
    };
    let status;
    let payload;

    await authController.refresh(
        { body: { refresh_token: 'expired-token' } },
        {
            status(code) {
                status = code;
                return this;
            },
            json(body) {
                payload = body;
                return this;
            },
        },
    );

    assert.equal(status, 401);
    assert.match(payload.message, /expired/i);
});
