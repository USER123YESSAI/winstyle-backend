import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { sequelize, User, Realisation } from './models/index.js';

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
        return;

    }








    // Seed superadmin
    const existing = await User.findOne({ where: { email: 'admin@wins-agency.sn' } });
    if (existing) {
        if (!existing.nom) {
            await existing.update({ nom: 'Super Admin', role: 'superadmin' });
            console.log('Compte mis à jour → superadmin');
        } else {
            console.log('Superadmin déjà existant.');
        }
    } else {
        const hashedPassword = await bcrypt.hash('Admin@2024', 10);
        await User.create({
            nom: 'Super Admin',
            email: 'admin@wins-agency.sn',
            password: hashedPassword,
            role: 'superadmin',
        });
        console.log("Superadmin créé : admin@wins-agency.sn / Admin@2024");
    }

    // Seed realisations
    const realisationsData = [
        {
            titre: 'RASMA 2025',
            date: 'Mars 2025',
            categorie: 'RASMA',
            description: 'Rassemblement Annuel WinStyle - Le plus grand événement de l\'année réunissant partenaires et clients.',
            image: '/images/rasma/rasma-hero.jpg',
        },
        {
            titre: 'Collection Printemps-Été',
            date: 'Février 2025',
            categorie: 'Mode',
            description: 'Présentation de la nouvelle collection #WinstyleFashion inspirée du continent africain.',
            image: '/images/services/confection.jpg',
        },
        {
            titre: 'Formation Protocole VIP',
            date: 'Janvier 2025',
            categorie: 'Formation',
            description: 'Programme de formation avancée en accueil et protocole pour personnel diplomatique.',
            image: '/images/services/formation.jpg',
        },
        {
            titre: 'Gala de Charité',
            date: 'Décembre 2024',
            categorie: 'Agence',
            description: 'Animation et gestion d\'hôtesses pour un gala caritatif à N\'Djaména.',
            image: '/images/services/hotesses-stewards.jpg',
        },
        {
            titre: 'Fashion Week Tchad',
            date: 'Novembre 2024',
            categorie: 'Mode',
            description: 'Défilé exclusif présentant nos créations de robes de soirée et tenues de cérémonie.',
            image: '/images/services/confection2.jpg',
        },
        {
            titre: 'Forum Economique',
            date: 'Octobre 2024',
            categorie: 'RASMA',
            description: 'Organisation complète du forum économique avec équipe hôtesses et steward.',
            image: '/images/rasma/rasma1-hero.jpg',
        },
        {
            titre: 'Formation Entreprise',
            date: 'Septembre 2024',
            categorie: 'Formation',
            description: 'Session de coaching en posture et présentation professionnelle pour cadres.',
            image: '/images/services/formation.jpg',
        },
        {
            titre: 'Lancement Produit Cosmétique',
            date: 'Août 2024',
            categorie: 'Mode',
            description: 'Event de lancement de la gamme capillaire bio avec modèles et égéries.',
            image: '/images/services/cosmetique.jpg',
        },
    ];

    for (const data of realisationsData) {
        const existingReal = await Realisation.findOne({ where: { titre: data.titre, date: data.date } });
        if (!existingReal) {
            await Realisation.create(data);
            console.log(`Réalisation créée: ${data.titre}`);
        }
    }
    console.log('Seed terminé!');
    process.exit(0);
};

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
