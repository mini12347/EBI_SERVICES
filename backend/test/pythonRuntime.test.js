const assert = require('node:assert/strict');
const test = require('node:test');
const { getPythonInvocation } = require('../utils/pythonRuntime');

test('uses the Python launcher on Windows', () => {
    assert.deepEqual(getPythonInvocation('win32', ''), {
        command: 'py',
        args: ['-3'],
    });
});

test('uses python3 on non-Windows platforms', () => {
    assert.deepEqual(getPythonInvocation('linux', ''), {
        command: 'python3',
        args: [],
    });
});

test('uses an explicitly configured Python executable', () => {
    assert.deepEqual(getPythonInvocation('win32', 'C:\\Python311\\python.exe'), {
        command: 'C:\\Python311\\python.exe',
        args: [],
    });
});
