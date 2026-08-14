require('dotenv').config();
const mongoose = require('mongoose');
const Utilisateur = require('./models/utilisateur');
const Service = require('./models/service');
const DemandeDevis = require('./models/demandeDevi');
const Devis = require('./models/devi');
const Document = require('./models/document');
const Message = require('./models/message');
const Notification = require('./models/notification');
const Token = require('./models/jwt_tokens');

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        await Promise.all([
            Utilisateur.deleteMany(),
            Service.deleteMany(),
            DemandeDevis.deleteMany(),
            Devis.deleteMany(),
            Document.deleteMany(),
            Message.deleteMany(),
            Notification.deleteMany(),
            Token.deleteMany(),
        ]);
        console.log('Cleared existing data');

        // ───── Users (plain passwords — the pre('save') hook hashes them) ─────
        const users = await Utilisateur.create([
            { fullname: 'Admin EBI', email: 'admin@ebi-services.com', telephone: 3312345678, password: 'password123', entreprise: 'EBI Services', role: 'admin', emailVerified: true },
            { fullname: 'Minyar Admin', email: 'minyar1820@gmail.com', telephone: 3312345679, password: 'password123', entreprise: 'EBI Services', role: 'admin', emailVerified: true },
            { fullname: 'Sophie Martin', email: 'sophie.martin@example.com', telephone: 33611223344, password: 'password123', entreprise: 'Martin SARL', role: 'client', emailVerified: true },
            { fullname: 'Pierre Durant', email: 'pierre.durant@example.com', telephone: 33655667788, password: 'password123', entreprise: 'Durant & Fils', role: 'client', emailVerified: true },
            { fullname: 'Minyar Client', email: 'minyar.client@gmail.com', telephone: 33699887766, password: 'password123', entreprise: 'EBI Services', role: 'client', emailVerified: true },
            { fullname: 'Visiteur Test', email: 'visitor@example.com', telephone: 3377889900, password: 'password123', role: 'visitor', emailVerified: true },
            { fullname: 'Jean Dupont', email: 'jean.dupont@admin.com', telephone: 33112233445, password: 'password123', entreprise: 'EBI Services', role: 'admin', emailVerified: true },
        ]);
        const [admin1, adminMinyar, client1, client2, clientMinyar, visitor, admin2] = users;
        console.log(`Created ${users.length} users`);

        // ───── Services ─────
        const services = await Service.create([
            { nom: 'Audit énergétique', description: 'Diagnostic complet de la performance énergétique du bâtiment' },
            { nom: 'Installation panneaux solaires', description: 'Étude et installation de panneaux photovoltaïques' },
            { nom: 'Isolation thermique', description: 'Isolation des combles, murs et planchers' },
            { nom: 'Chaudière biomasse', description: 'Installation et entretien de chaudières à biomasse' },
            { nom: 'Pompe à chaleur', description: 'Installation de pompes à chaleur air/eau et géothermiques' },
            { nom: 'Consulting énergétique', description: 'Conseil stratégique en efficacité énergétique' },
        ]);
        console.log(`Created ${services.length} services`);

        // ───── Demandes de devis (quote requests) ─────
        const demandes = await DemandeDevis.create([
            // Sophie Martin's requests
            { client: client1._id, service: services[0]._id, manager: admin1._id, besoin: 'Je souhaite un audit complet pour mon immeuble de bureaux de 500m2', statut: 'en_cours' },
            { client: client1._id, service: services[2]._id, besoin: 'Devis pour isolation des combles d\'une maison de 120m2', statut: 'en_attente' },
            { client: client1._id, service: services[4]._id, besoin: 'Installation pompe à chaleur pour maison individuelle 150m2', statut: 'en_attente' },
            // Pierre Durant's requests
            { client: client2._id, service: services[1]._id, manager: admin1._id, besoin: 'Installation de 20 panneaux solaires sur toiture industrielle', statut: 'devis_envoye' },
            { client: client2._id, service: services[3]._id, manager: admin2._id, besoin: 'Remplacement chaudière fioul par biomasse', statut: 'accepte' },
            { client: client2._id, service: services[5]._id, besoin: 'Audit énergétique pour site industriel', statut: 'en_attente' },
            // Minyar Client's requests
            { client: clientMinyar._id, service: services[0]._id, besoin: 'Audit énergétique pour maison individuelle 180m2', statut: 'en_attente' },
            { client: clientMinyar._id, service: services[1]._id, manager: admin1._id, besoin: 'Devis pour installation de 12 panneaux solaires', statut: 'en_cours' },
            { client: clientMinyar._id, service: services[2]._id, manager: adminMinyar._id, besoin: 'Isolation des combles et murs extérieurs', statut: 'devis_envoye' },
        ]);
        console.log(`Created ${demandes.length} demandes de devis`);

        // ───── Devis (quotes) ─────
        const now = new Date();
        const devis = await Devis.create([
            { demande: demandes[0]._id, fichier_pdf: 'https://storage.ebi-services.com/devis/audit-001.pdf', montant: 3500, statut: 'envoye' },
            { demande: demandes[3]._id, fichier_pdf: 'https://storage.ebi-services.com/devis/solaire-002.pdf', montant: 18500, statut: 'envoye' },
            { demande: demandes[4]._id, fichier_pdf: 'https://storage.ebi-services.com/devis/biomasse-003.pdf', montant: 12000, statut: 'telecharge', date_telechargement: new Date(now.getTime() - 86400000) },
            { demande: demandes[8]._id, fichier_pdf: 'https://storage.ebi-services.com/devis/isolation-004.pdf', montant: 8900, statut: 'envoye' },
        ]);
        console.log(`Created ${devis.length} devis`);

        // ───── Documents ─────
        const docs = await Document.create([
            // Sophie Martin's documents
            { client: client1._id, demande: demandes[0]._id, nom_fichier: 'facture_elec_2025.pdf', lien: 'https://storage.ebi-services.com/docs/facture-elec.pdf', uploaded_by: client1._id, origine: 'client', taille: 204800, type_mime: 'application/pdf' },
            { client: client1._id, demande: demandes[0]._id, nom_fichier: 'plan_batiment.dwg', lien: 'https://storage.ebi-services.com/docs/plan-batiment.dwg', uploaded_by: admin1._id, origine: 'admin', taille: 5120000, type_mime: 'application/dwg' },
            // Pierre Durant's documents
            { client: client2._id, demande: demandes[3]._id, nom_fichier: 'photos_toiture.zip', lien: 'https://storage.ebi-services.com/docs/photos-toiture.zip', uploaded_by: client2._id, origine: 'client', taille: 15728640, type_mime: 'application/zip' },
            { client: client2._id, demande: demandes[4]._id, nom_fichier: 'carnet_chaudiere.pdf', lien: 'https://storage.ebi-services.com/docs/carnet-chaudiere.pdf', uploaded_by: client2._id, origine: 'client', taille: 102400, type_mime: 'application/pdf' },
            // Minyar Client's documents
            { client: clientMinyar._id, demande: demandes[6]._id, nom_fichier: 'diagnostic_DPE.pdf', lien: 'https://storage.ebi-services.com/docs/dpe-2025.pdf', uploaded_by: clientMinyar._id, origine: 'client', taille: 153600, type_mime: 'application/pdf' },
            { client: clientMinyar._id, demande: demandes[7]._id, nom_fichier: 'photos_toiture_residence.zip', lien: 'https://storage.ebi-services.com/docs/photos-toiture-residence.zip', uploaded_by: clientMinyar._id, origine: 'client', taille: 8388608, type_mime: 'application/zip' },
        ]);
        console.log(`Created ${docs.length} documents`);

        // ───── Messages (conversation threads) ─────
        const messages = await Message.create([
            // Sophie Martin - Admin conversation
            { client: client1._id, expediteur: client1._id, contenu: 'Bonjour, pourriez-vous me donner plus de détails sur l\'audit énergétique ?', lu: true, createdAt: new Date(now.getTime() - 86400000 * 5) },
            { client: client1._id, expediteur: admin1._id, contenu: 'Bonjour Sophie, bien sûr. Notre audit inclut une visite technique, une analyse des factures et un rapport détaillé.', lu: true, createdAt: new Date(now.getTime() - 86400000 * 4) },
            { client: client1._id, expediteur: client1._id, contenu: 'Parfait, merci ! Pouvez-vous inclure un chiffrage des travaux recommandés ?', lu: true, createdAt: new Date(now.getTime() - 86400000 * 3) },
            { client: client1._id, expediteur: admin1._id, contenu: 'Oui, le rapport inclut une estimation chiffrée pour chaque recommandation.', lu: true, createdAt: new Date(now.getTime() - 86400000 * 2) },
            // Pierre Durant - Admin conversation
            { client: client2._id, expediteur: admin1._id, contenu: 'Bonjour Pierre, nous avons bien reçu votre demande. Un technicien vous contactera sous 48h.', lu: true, createdAt: new Date(now.getTime() - 86400000 * 7) },
            { client: client2._id, expediteur: client2._id, contenu: 'Merci. Pouvez-vous me donner un rendez-vous la semaine prochaine ?', lu: true, createdAt: new Date(now.getTime() - 86400000 * 6) },
            { client: client2._id, expediteur: admin1._id, contenu: 'Bien sûr, je vous propose jeudi 14h. Cela vous convient-il ?', lu: true, createdAt: new Date(now.getTime() - 86400000 * 5) },
            { client: client2._id, expediteur: client2._id, contenu: 'Parfait, je suis disponible à ce créneau.', lu: true, createdAt: new Date(now.getTime() - 86400000 * 4) },
            // Minyar Client - AdminMinyar conversation
            { client: clientMinyar._id, expediteur: clientMinyar._id, contenu: 'Bonjour, je souhaite des informations sur l\'installation de panneaux solaires.', lu: true, createdAt: new Date(now.getTime() - 86400000 * 3) },
            { client: clientMinyar._id, expediteur: adminMinyar._id, contenu: 'Bonjour ! Avec plaisir. Nous proposons des installations clé en main avec un suivi personnalisé.', lu: true, createdAt: new Date(now.getTime() - 86400000 * 2) },
            { client: clientMinyar._id, expediteur: clientMinyar._id, contenu: 'Excellent ! Pouvez-vous m\'envoyer un devis pour 12 panneaux ?', lu: true, createdAt: new Date(now.getTime() - 86400000) },
            { client: clientMinyar._id, expediteur: adminMinyar._id, contenu: 'Bien reçu ! Je prépare le devis et vous le transmets sous 24h.', lu: false, createdAt: now },
        ]);
        console.log(`Created ${messages.length} messages`);

        // ───── Notifications ─────
        const notifications = await Notification.create([
            // Sophie Martin notifications
            { destinataire: client1._id, type: 'nouveau_message', reference_id: messages[0]._id, contenu: 'Nouveau message de votre conseiller EBI', lu: true },
            { destinataire: client1._id, type: 'statut_demande', reference_id: demandes[0]._id, contenu: 'Votre demande #1 est en cours de traitement', lu: false },
            { destinataire: client1._id, type: 'statut_demande', reference_id: demandes[2]._id, contenu: 'Votre demande de pompe à chaleur a été reçue', lu: false },
            // Pierre Durant notifications
            { destinataire: client2._id, type: 'nouveau_devis', reference_id: devis[0]._id, contenu: 'Votre devis pour l\'installation solaire est disponible', lu: false },
            { destinataire: client2._id, type: 'nouveau_document', reference_id: docs[2]._id, contenu: 'Nouveau document partagé par EBI Services', lu: false },
            { destinataire: client2._id, type: 'statut_demande', reference_id: demandes[4]._id, contenu: 'Votre demande de remplacement chaudière a été acceptée', lu: true },
            // Minyar Client notifications
            { destinataire: clientMinyar._id, type: 'nouveau_message', reference_id: messages[8]._id, contenu: 'Bienvenue sur votre espace client EBI Services', lu: true },
            { destinataire: clientMinyar._id, type: 'statut_demande', reference_id: demandes[7]._id, contenu: 'Votre demande de panneaux solaires est en cours de traitement', lu: false },
            { destinataire: clientMinyar._id, type: 'nouveau_devis', reference_id: devis[3]._id, contenu: 'Votre devis pour l\'isolation est disponible', lu: false },
            // Admin notifications
            { destinataire: admin1._id, type: 'nouveau_message', reference_id: messages[0]._id, contenu: 'Nouveau message de Sophie Martin', lu: true },
            { destinataire: adminMinyar._id, type: 'nouveau_message', reference_id: messages[8]._id, contenu: 'Nouveau message de Minyar Client', lu: true },
        ]);
        console.log(`Created ${notifications.length} notifications`);

        console.log('\n✓ Seed completed successfully');
        console.log('\n=== CREDENTIALS ===');
        console.log('Admin accounts:');
        console.log('  Email: admin@ebi-services.com  | Password: password123 | Role: admin');
        console.log('  Email: minyar1820@gmail.com      | Password: password123 | Role: admin');
        console.log('  Email: jean.dupont@admin.com      | Password: password123 | Role: admin');
        console.log('');
        console.log('Client accounts:');
        console.log('  Email: sophie.martin@example.com  | Password: password123 | Role: client');
        console.log('  Email: pierre.durant@example.com  | Password: password123 | Role: client');
        console.log('  Email: minyar.client@gmail.com    | Password: password123 | Role: client');
        console.log('');
        console.log('Visitor account:');
        console.log('  Email: visitor@example.com        | Password: password123 | Role: visitor');

        process.exit(0);
    } catch (error) {
        console.error('Seed failed:', error.message);
        process.exit(1);
    }
};

seed();
