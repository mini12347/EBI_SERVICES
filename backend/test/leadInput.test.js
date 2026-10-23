const assert = require('node:assert/strict');
const test = require('node:test');
const { normalizeLeadInput } = require('../utils/leadInput');

test('contact form and chatbot requests normalize to the same lead shape', () => {
    const contact = normalizeLeadInput({
        name: '  Nadia Martin ',
        email: ' NADIA@example.com ',
        phone: '+33 6 12 34 56 78',
        need: 'Développer une application web',
        source: 'contact_form',
    });
    const chatbot = normalizeLeadInput({
        name: 'Nadia Martin',
        email: 'nadia@example.com',
        phone: '+33 6 12 34 56 78',
        projectDescription: 'Développer une application web',
        source: 'chatbot',
        suggestedDepartment: 'Development',
    });

    assert.equal(contact.errors, undefined);
    assert.equal(chatbot.errors, undefined);
    assert.equal(contact.value.name, chatbot.value.name);
    assert.equal(contact.value.email, chatbot.value.email);
    assert.equal(contact.value.phone, chatbot.value.phone);
    assert.equal(contact.value.projectDescription, chatbot.value.projectDescription);
    assert.equal(contact.value.source, 'contact_form');
    assert.equal(chatbot.value.source, 'chatbot');
});

test('lead submission requires a valid email and a described need', () => {
    const result = normalizeLeadInput({
        name: 'Nadia Martin',
        email: 'not-an-email',
        projectDescription: '  ',
    });

    assert.equal(result.value, undefined);
    assert.deepEqual(Object.keys(result.errors).sort(), ['email', 'projectDescription']);
});

test('public lead input cannot set CRM status, priority, or an unknown source', () => {
    const result = normalizeLeadInput({
        name: 'Nadia Martin',
        email: 'nadia@example.com',
        projectDescription: 'Recrutement IT',
        status: 'qualified',
        priority: 'high',
        source: 'admin',
        suggestedDepartment: 'Unknown',
    });

    assert.equal(result.errors, undefined);
    assert.equal(result.value.priority, 'medium');
    assert.equal(result.value.source, 'chatbot');
    assert.equal(result.value.suggestedDepartment, 'Development');
    assert.equal(result.value.status, undefined);
});
