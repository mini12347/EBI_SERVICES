const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const QUOTES_DIR = path.join(UPLOADS_DIR, 'quotes');
const DOCUMENTS_DIR = path.join(UPLOADS_DIR, 'documents');

[QUOTES_DIR, DOCUMENTS_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

function formatMoney(amount) {
    const value = Number(amount) || 0;
    return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

function formatDate(date) {
    if (!date) return new Date().toLocaleDateString('fr-FR');
    return new Date(date).toLocaleDateString('fr-FR');
}

function drawBrandHeader(doc) {
    doc.rect(0, 0, doc.page.width, 90).fill('#1e3a5f');
    doc.fill('#ffffff')
        .font('Helvetica-Bold')
        .fontSize(22)
        .text('EBI SERVICES', 40, 22);
    doc.font('Helvetica')
        .fontSize(10)
        .text('Votre Partenaire en Performance et Transformation', 40, 52);
    doc.font('Helvetica-Bold')
        .fontSize(9)
        .text('Tele-services  |  BPO  |  Solutions IT & Digitales  |  Sourcing & Integration de profils', 40, 70);
}

function drawFooter(doc) {
    const y = doc.page.height - 50;
    doc.rect(0, y, doc.page.width, 50).fill('#f1f5f9');
    doc.fill('#334155')
        .font('Helvetica')
        .fontSize(8)
        .text(
            `EBI Services - ${new Date().getFullYear()} | Adresse: Cotonou, Benin | Email: contact@ebiservice.com | Tel: +229 00 00 00 00`,
            40,
            y + 12,
            { align: 'center', width: doc.page.width - 80 },
        );
}

// ---------------------------------------------------------------------------
// Quote (devis) PDF
// ---------------------------------------------------------------------------
async function generateQuotePDF({ devis, demande, client, service, terms }) {
    const safeId = (devis._id || devis.id || Date.now()).toString().slice(-8);
    const fileName = `quote-${safeId}-${Date.now()}.pdf`;
    const filePath = path.join(QUOTES_DIR, fileName);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    drawBrandHeader(doc);

    const topY = 120;
    doc.fill('#1e3a5f').font('Helvetica-Bold').fontSize(18).text('DEVIS / QUOTATION', 40, topY);

    doc.font('Helvetica').fontSize(9).fill('#64748b')
        .text(`Reference: EBI-${safeId}`, 40, topY + 28)
        .text(`Date: ${formatDate(devis.createdAt || new Date())}`, 40, topY + 42);

    // Client block
    const clientName = (client && (client.fullname || client.name)) || (demande && demande.client_name) || 'Client';
    const clientEmail = (client && client.email) || '';
    const clientCompany = (client && client.entreprise) || '';
    const boxY = topY + 70;
    doc.rect(40, boxY, doc.page.width - 80, 70).fill('#f8fafc').stroke('#e2e8f0');
    doc.fill('#1e3a5f').font('Helvetica-Bold').fontSize(10).text('INFORMATIONS CLIENT / CLIENT DETAILS', 52, boxY + 10);
    doc.fill('#0f172a').font('Helvetica').fontSize(10)
        .text(`Client: ${clientName}`, 52, boxY + 28)
        .text(`Email: ${clientEmail || '-'}`, 52, boxY + 44)
        .text(`Societe: ${clientCompany || '-'}`, 52, boxY + 58);

    // Service / project
    const serviceName = (service && service.nom) || (demande && demande.service_name) || 'Service';
    const besoin = (demande && demande.besoin) || (devis && devis.besoin) || '';
    const projectY = boxY + 90;
    doc.fill('#1e3a5f').font('Helvetica-Bold').fontSize(12).text('SERVICE / PROJECT', 40, projectY);
    doc.fill('#0f172a').font('Helvetica').fontSize(10).text(String(serviceName), 40, projectY + 20);
    if (besoin) {
        doc.font('Helvetica').fontSize(9).fill('#475569').text(`Description: ${besoin}`, 40, projectY + 38, {
            width: doc.page.width - 80,
        });
    }

    // Amount table
    const amountY = projectY + (besoin ? 110 : 70);
    doc.rect(40, amountY, doc.page.width - 80, 24).fill('#1e3a5f');
    doc.fill('#ffffff').font('Helvetica-Bold').fontSize(10)
        .text('MONTANT / AMOUNT', 52, amountY + 7);
    doc.rect(40, amountY + 24, doc.page.width - 80, 24).fill('#f1f5f9');
    doc.fill('#0f172a').font('Helvetica-Bold').fontSize(12)
        .text(formatMoney(devis.montant), 40, amountY + 31, { align: 'right', width: doc.page.width - 80 });

    if (terms) {
        const termsY = amountY + 66;
        doc.fill('#1e3a5f').font('Helvetica-Bold').fontSize(10).text('CONDITIONS / TERMS', 40, termsY);
        doc.fill('#475569').font('Helvetica').fontSize(8).text(String(terms), 40, termsY + 16, {
            width: doc.page.width - 80,
            lineGap: 4,
        });
    }

    drawFooter(doc);

    return new Promise((resolve, reject) => {
        stream.on('finish', () => resolve(filePath));
        stream.on('error', reject);
        doc.end();
    });
}

// ---------------------------------------------------------------------------
// Document summary PDF
// ---------------------------------------------------------------------------
async function generateDocumentSummaryPDF({ document, client, uploaded_by }) {
    const safeId = (document._id || document.id || Date.now()).toString().slice(-8);
    const fileName = `doc-summary-${safeId}-${Date.now()}.pdf`;
    const filePath = path.join(DOCUMENTS_DIR, fileName);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    drawBrandHeader(doc);

    const topY = 120;
    doc.fill('#1e3a5f').font('Helvetica-Bold').fontSize(18).text('DOCUMENT SUMMARY', 40, topY);
    doc.font('Helvetica').fontSize(9).fill('#64748b')
        .text(`Generated: ${formatDate(new Date())}`, 40, topY + 28)
        .text(`Reference: EBI-DOC-${safeId}`, 40, topY + 42);

    const boxY = topY + 70;
    doc.rect(40, boxY, doc.page.width - 80, 150).fill('#f8fafc').stroke('#e2e8f0');

    doc.fill('#1e3a5f').font('Helvetica-Bold').fontSize(10).text('FILE DETAILS', 52, boxY + 12);

    const details = [
        ['Nom du fichier', (document && document.nom_fichier) || '-'],
        ['Client', (client && (client.fullname || client.name)) || '-'],
        ['Email', (client && client.email) || '-'],
        ['Date de depot', formatDate((document && document.createdAt) || new Date())],
        ['Type MIME', (document && document.type_mime) || '-'],
        ['Taille', document && document.taille ? `${(document.taille / 1024).toFixed(1)} KB` : '-'],
        ['Origine', (document && document.origine) || '-'],
        ['Uploaded by', (uploaded_by && (uploaded_by.fullname || uploaded_by.name)) || '-'],
    ];

    let yy = boxY + 32;
    doc.font('Helvetica').fontSize(9);
    for (const [label, value] of details) {
        doc.fill('#1e3a5f').font('Helvetica-Bold').text(`${label}:`, 52, yy);
        doc.fill('#0f172a').font('Helvetica').text(String(value), 160, yy);
        yy += 15;
    }

    drawFooter(doc);

    return new Promise((resolve, reject) => {
        stream.on('finish', () => resolve(filePath));
        stream.on('error', reject);
        doc.end();
    });
}

module.exports = { generateQuotePDF, generateDocumentSummaryPDF, QUOTES_DIR, DOCUMENTS_DIR };
