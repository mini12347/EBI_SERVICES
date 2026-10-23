const assert = require('node:assert/strict');
const test = require('node:test');
const serviceCatalog = require('../data/serviceCatalog');

test('service catalog covers each EBI department with unique stable codes', () => {
    const expectedDepartments = ['development', 'recruitment', 'tele-services'];
    const codes = serviceCatalog.map((service) => service.code);
    const departments = new Set(serviceCatalog.map((service) => service.departement));

    assert.equal(new Set(codes).size, codes.length, 'service codes must be unique');
    assert.deepEqual([...departments].sort(), expectedDepartments);
    assert.ok(serviceCatalog.every((service) => service.nom && service.description));
});

test('service catalog matches the scope of the project brief', () => {
    assert.equal(serviceCatalog.length, 16);
    assert.ok(serviceCatalog.some((service) => service.nom === 'Applications web'));
    assert.ok(serviceCatalog.some((service) => service.nom === 'Recrutement IT'));
    assert.ok(serviceCatalog.some((service) => service.nom === 'Back-office'));
});
