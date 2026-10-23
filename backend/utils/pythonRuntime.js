function getPythonInvocation(
    platform = process.platform,
    configuredExecutable = process.env.PYTHON_EXECUTABLE,
) {
    if (configuredExecutable) {
        return { command: configuredExecutable, args: [] };
    }

    if (platform === 'win32') {
        return { command: 'py', args: ['-3'] };
    }

    return { command: 'python3', args: [] };
}

module.exports = { getPythonInvocation };
