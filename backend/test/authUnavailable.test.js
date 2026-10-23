const assert = require('assert');
const { login } = require('../controllers/authController');

(async () => {
  global.__dbConnected = false;

  let statusCode = 200;
  let payload = null;

  const req = {
    body: {
      email: 'admin@ebi-services.com',
      password: 'password123',
    },
  };

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      payload = data;
      return this;
    },
  };

  await login(req, res);

  assert.strictEqual(statusCode, 503, 'login should be unavailable when the database is offline');
  assert.deepStrictEqual(payload, {
    message: 'Authentication unavailable because the database is currently unreachable.',
    error: 'DB_UNAVAILABLE',
  });
  console.log('auth unavailable test passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
