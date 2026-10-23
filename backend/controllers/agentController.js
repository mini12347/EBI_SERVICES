const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const { getPythonInvocation } = require('../utils/pythonRuntime');

const AGENT_DIR = path.resolve(__dirname, '../../agent');

exports.queryAgent = async (req, res) => {
    try {
        const { query, lang } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        const pythonScript = path.join(AGENT_DIR, 'main.py');
        const python = getPythonInvocation();
        const args = [...python.args, pythonScript, query];
        if (lang === 'fr' || lang === 'en') {
            args.push(lang);
        }
        const child = execFile(python.command, args, {
            cwd: AGENT_DIR,
            timeout: 60000,
            env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
        });

        let stdout = '';
        let stderr = '';
        let timedOut = false;

        const timeoutTimer = setTimeout(() => {
            timedOut = true;
            child.kill();
        }, 60000);

        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('error', (err) => {
            clearTimeout(timeoutTimer);
            return res.status(500).json({
                error: 'Failed to start Python agent',
                details: err.message,
            });
        });

        child.on('close', (code) => {
            clearTimeout(timeoutTimer);
            if (timedOut) {
                return res.status(500).json({
                    error: 'Agent execution timed out',
                    details: stderr,
                });
            }
            if (code !== 0) {
                return res.status(500).json({
                    error: 'Agent execution failed',
                    details: stderr,
                });
            }
            res.json({ response: stdout.trim(), query });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getKnowledgeBase = async (req, res) => {
    try {
        const txtPath = path.join(AGENT_DIR, 'EBI_Services_Info.txt');
        const contextsPath = path.join(AGENT_DIR, 'department_contexts.py');

        let txtContent = '';
        let departmentContexts = {};

        if (fs.existsSync(txtPath)) {
            txtContent = fs.readFileSync(txtPath, 'utf-8');
        }

        if (fs.existsSync(contextsPath)) {
            const contextsRaw = fs.readFileSync(contextsPath, 'utf-8');
            const lines = contextsRaw.split('\n');
            let currentDept = '';
            for (const line of lines) {
                const deptMatch = line.match(/"([^"]+)":\s*"""/);
                if (deptMatch) {
                    currentDept = deptMatch[1];
                    departmentContexts[currentDept] = '';
                } else if (currentDept && !line.includes('GENERAL_BASE')) {
                    departmentContexts[currentDept] += line + '\n';
                }
            }
        }

        res.json({
            companyInfo: txtContent,
            departmentContexts,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getDepartmentContexts = async (req, res) => {
    try {
        const contextsPath = path.join(AGENT_DIR, 'department_contexts.py');
        if (!fs.existsSync(contextsPath)) {
            return res.status(404).json({ error: 'Contexts file not found' });
        }

        const GENERAL_BASE = `
EBI SERVICES - PRESENTATION GENERALE
Nom: EBI Services
Slogan: "Votre Partenaire en Performance et Transformation"
Depuis plus de 8 ans, EBI Services accompagne ses partenaires dans
l'evolution de leurs infrastructures et le renforcement de leurs
performances digitales.

Gamme de services:
1) Tele-services
2) Business Process Outsourcing (BPO)
3) Solutions IT & Digitales
4) Sourcing & Integration de profils
`;

        const departments = [
            {
                name: 'Tele-services',
                services: [
                    'Gestion professionnelle des appels entrants - Service client reactif 7j/7 - 24h/24',
                    'Televante & prospection commerciale B2B / B2C',
                    'Prise de rendez-vous qualifies',
                    'Telesecretariat & gestion d\'agendas',
                    'Enquetes de satisfaction & fidelisation client',
                    'Saisie & Traitement de Donnees',
                    'Creation de Trafic & Generation de Leads',
                ]
            },
            {
                name: 'Business Process Outsourcing (BPO)',
                services: [
                    'Externalisation de la relation client (Call Center & Teleservices)',
                    'Gestion back-office et taches administratives',
                    'Saisie et traitement de donnees',
                    'Gestion des commandes et suivi clients',
                    'Support technique (niveau 1)',
                    'Assistance operationnelle sur mesure',
                ]
            },
            {
                name: 'Solutions IT & Digitales',
                services: [
                    'Services Managers - Gestion proactive des infrastructures',
                    'Services Web & Mobile - Developpement sur mesure',
                    'Developpement & Integration ERP',
                ]
            },
            {
                name: 'Sourcing & Integration de profils',
                services: [
                    'Sourcing - Identifier les talents d\'exception',
                    'Placement des profils - Garantir l\'adequation parfaite',
                ]
            }
        ];

        res.json({ generalInfo: GENERAL_BASE, departments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.classifyIntent = async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        const pythonScript = path.join(AGENT_DIR, 'intent_classifier.py');
        const python = getPythonInvocation();
        const child = execFile(python.command, [
            ...python.args,
            pythonScript,
            query,
        ], {
            cwd: AGENT_DIR,
            timeout: 15000,
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('close', (code) => {
            if (code !== 0) {
                return res.status(500).json({
                    error: 'Intent classification failed',
                    details: stderr,
                });
            }
            try {
                const result = JSON.parse(stdout.trim());
                res.json(result);
            } catch {
                res.json({ intent: stdout.trim(), confiance: 0, raison: 'Raw output' });
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.healthCheck = async (req, res) => {
    const pythonInstalled = await new Promise((resolve) => {
        const python = getPythonInvocation();
        execFile(python.command, [...python.args, '--version'], { timeout: 5000 }, (err) => {
            resolve(!err);
        });
    });

    res.json({
        status: 'ok',
        python: pythonInstalled,
        agentDir: fs.existsSync(AGENT_DIR),
        mainPy: fs.existsSync(path.join(AGENT_DIR, 'main.py')),
        infoTxt: fs.existsSync(path.join(AGENT_DIR, 'EBI_Services_Info.txt')),
    });
};
