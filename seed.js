import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { sequelize, User, Realisation, Partenaire, Temoignage } from './models/index.js';
import { ensureCmsDefaultsSeeded } from './controllers/cms.controller.js';

// Charger le bon .env (pour éviter les cas où dotenv ne trouve pas le fichier)
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
// Support local override (quand .env est fourni/commit-safe)
dotenv.config({ path: path.join(__dirname, '.env.local') });



const seed = async () => {
    if (process.env.DB_SYNC !== 'true') {
        throw new Error("Seed bloqué: DB_SYNC n'est pas à 'true'. Passe DB_SYNC=true pour autoriser sequelize.sync.");
    }
    // Assurer que le schéma existe (tables/colonnes) avant de seed.
    // NOTE: MySQL peut refuser `sync()` si certaines données/systèmes (tablespace) existent déjà.
    // Donc on tolère l'erreur ER_TABLESPACE_EXISTS : on peut quand même seed les lignes.
    try {
        await sequelize.sync({ alter: false, force: false });
    } catch (e) {
        if (e?.original?.code !== 'ER_TABLESPACE_EXISTS') {
            throw e;
        }

        // Cas MySQL: tablespace déjà existant.
        // Sur certains dumps, Sequelize essaie un IMPORT qui bloque.
        // On ignore l'erreur ici : le seed peut quand même fonctionner si les tables existent déjà.
        console.warn('ER_TABLESPACE_EXISTS détecté : sync bloquée mais on tente quand même de seed.');
    }

    // Seed superadmin
    const adminEmail = process.env.SUPERADMIN_EMAIL || 'admin@winstyle.com';
    const adminPassword = process.env.SUPERADMIN_PASSWORD || 'ChangeMeInProd2026!';
    const existing = await User.findOne({ where: { email: adminEmail } });
    if (existing) {
        if (!existing.nom) {
            await existing.update({ nom: 'Super Admin', role: 'superadmin' });
            console.log('Compte mis à jour → superadmin');
        } else {
            console.log('Superadmin déjà existant.');
        }
    } else {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await User.create({
            nom: 'Super Admin',
            email: adminEmail,
            password: hashedPassword,
            role: 'superadmin',
        });
        console.log(`Superadmin créé : ${adminEmail}`);
    }

    // Seed realisations
    const realisationsData = [
        {
            titre: 'RASMA 2025',
            date: '2025-03-15',
            categorie: 'RASMA',
            description: 'Rassemblement Annuel WinStyle - Le plus grand événement de l\'année réunissant partenaires et clients.',
            images: JSON.stringify(['/images/rasma/rasma-hero.jpg']),
        },
        {
            titre: 'Collection Printemps-Été',
            date: '2025-02-10',
            categorie: 'Mode',
            description: 'Présentation de la nouvelle collection #WinstyleFashion inspirée du continent africain.',
            images: JSON.stringify(['/images/services/confection.jpg']),
        },
        {
            titre: 'Formation Protocole VIP',
            date: '2025-01-20',
            categorie: 'Formation',
            description: 'Programme de formation avancée en accueil et protocole pour personnel diplomatique.',
            images: JSON.stringify(['/images/services/formation.jpg']),
        },
        {
            titre: 'Gala de Charité',
            date: '2024-12-18',
            categorie: 'Agence',
            description: 'Animation et gestion d\'hôtesses pour un gala caritatif à N\'Djaména.',
            images: JSON.stringify(['/images/services/hotesses-stewards.jpg']),
        },
        {
            titre: 'Fashion Week Tchad',
            date: '2024-11-12',
            categorie: 'Mode',
            description: 'Défilé exclusif présentant nos créations de robes de soirée et tenues de cérémonie.',
            images: JSON.stringify(['/images/services/confection2.jpg']),
        },
        {
            titre: 'Forum Economique',
            date: '2024-10-05',
            categorie: 'RASMA',
            description: 'Organisation complète du forum économique avec équipe hôtesses et steward.',
            images: JSON.stringify(['/images/rasma/rasma1-hero.jpg']),
        },
        {
            titre: 'Formation Entreprise',
            date: '2024-09-14',
            categorie: 'Formation',
            description: 'Session de coaching en posture et présentation professionnelle pour cadres.',
            images: JSON.stringify(['/images/services/formation.jpg']),
        },
        {
            titre: 'Lancement Produit Cosmétique',
            date: '2024-08-22',
            categorie: 'Mode',
            description: 'Event de lancement de la gamme capillaire bio avec modèles et égéries.',
            images: JSON.stringify(['/images/services/cosmetique.jpg']),
        },
    ];

    for (const data of realisationsData) {
        const existingReal = await Realisation.findOne({ where: { titre: data.titre } });
        if (!existingReal) {
            await Realisation.create(data);
            console.log(`Réalisation créée: ${data.titre}`);
        } else if (!existingReal.images || existingReal.images === '[]') {
            await existingReal.update({ images: data.images, date: data.date });
            console.log(`Réalisation mise à jour avec image: ${data.titre}`);
        }
    }

    // Seed partenaires par défaut si table vide
    if ((await Partenaire.count()) === 0) {
        await Partenaire.bulkCreate([
            { nom: 'RASMA', logo: '/images/partenaires/partenaire2.png', site_web: null, actif: true, ordre: 1 },
            { nom: 'Partenaire 3', logo: '/images/partenaires/partenaire3.png', site_web: null, actif: true, ordre: 2 },
            { nom: 'Partenaire 4', logo: '/images/partenaires/partenaire4.png', site_web: null, actif: true, ordre: 3 },
            { nom: 'Partenaire 5', logo: '/images/partenaires/partenaire5.png', site_web: null, actif: true, ordre: 4 },
            { nom: 'Partenaire 6', logo: '/images/partenaires/partenaire6.png', site_web: null, actif: true, ordre: 5 },
            { nom: 'Partenaire 7', logo: '/images/partenaires/partenaire7.png', site_web: null, actif: true, ordre: 6 },
            { nom: 'Partenaire 8', logo: '/images/partenaires/partenaire8.png', site_web: null, actif: true, ordre: 7 },
        ]);
        console.log('Partenaires par défaut créés.');
    }

    // Seed témoignages par défaut si table vide
    if ((await Temoignage.count()) === 0) {
        await Temoignage.bulkCreate([
            {
                nom: 'Marie Remadji',
                fonction: 'Directrice Événements',
                entreprise: '',
                texte: 'Vos filles sont professionnelles, propres et naturelles mais surtout professionnelles. Je vous encourage vivement à continuer dans cette lancée.',
                photo: '/images/services/nounous.jpg',
                note: 5,
                actif: true,
                ordre: 1,
            },
            {
                nom: 'Jean-Pierre Mbairasssem',
                fonction: 'Organisateur Conférences',
                entreprise: '',
                texte: 'Bonjour boss! Merci pour le service, tes filles ont assuré. Service impeccable et ponctuel.',
                photo: '/images/team/team-2.jpg',
                note: 5,
                actif: true,
                ordre: 2,
            },
            {
                nom: 'Dénémadji Vanessa',
                fonction: 'Responsable Communication',
                entreprise: '',
                texte: "Coucou chérie! Super bien, j'ai aimé. Une équipe dynamique et toujours prête à rendre service.",
                photo: '/images/team/team-3.jpg',
                note: 5,
                actif: true,
                ordre: 3,
            },
        ]);
        console.log('Témoignages par défaut créés.');
    }

    await ensureCmsDefaultsSeeded();
    console.log('Sections CMS par défaut initialisées.');

    console.log('Seed terminé!');
    process.exit(0);
};

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
