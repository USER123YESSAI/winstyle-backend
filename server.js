import app from './app.js';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import {
  sequelize,
  User,
  Formation,
  Inscription,
  Candidature,
  ServiceRequest,
  Contact,
  ActivityLog,
  Realisation,
  Partenaire,
  Temoignage,
  CmsSection,
  MediaFile,
} from './models/index.js';
import { ensureCmsDefaultsSeeded } from './controllers/cms.controller.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.join(__dirname, '.env') });
}

const shouldSync = process.env.DB_SYNC === 'true';

// ── Création du superadmin au démarrage ──────────────────────────────────────
async function createSuperAdmin() {
  try {
    const email = process.env.SUPERADMIN_EMAIL || 'admin@winstyle.com';
    const password = process.env.SUPERADMIN_PASSWORD || 'Admin@@2025!';
    const nom = process.env.SUPERADMIN_NOM || 'Super Admin';

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log(`Superadmin déjà existant (${email}) — aucune action.`);
      return;
    }

    const hash = await bcrypt.hash(password, 10);
    await User.create({ nom, email, password: hash, role: 'superadmin' });
    console.log(`Superadmin créé : ${email}`);
  } catch (err) {
    console.error('Erreur création superadmin :', err?.message || err);
  }
}

// ── Synchronisation tolérante des nouvelles tables et données par défaut ─────
async function syncAndSeedDatabase() {
  const modelsToEnsure = [
    User,
    Formation,
    Inscription,
    Candidature,
    ServiceRequest,
    Contact,
    ActivityLog,
    Realisation,
    Partenaire,
    Temoignage,
    CmsSection,
    MediaFile,
  ];

  if (shouldSync) {
    console.log('DB_SYNC=true -> synchronisation des tables...');
    for (const model of modelsToEnsure) {
      try {
        await model.sync({ alter: false, force: false });
      } catch (e) {
        console.warn(`Avertissement sync table ${model.name} :`, e?.message || e);
      }
    }
  } else {
    try {
      await sequelize.authenticate();
      console.log('Authentification base de données OK (sequelize.authenticate).');
    } catch (e) {
      console.error('DB indisponible (serveur démarré quand même) :', e?.message || e);
    }
    // Toujours créer les nouvelles tables CMS / Partenaires / Témoignages / MediaFile si absentes
    for (const model of [Partenaire, Temoignage, CmsSection, MediaFile]) {
      try {
        await model.sync({ alter: false, force: false });
      } catch (e) {
        console.warn(`Avertissement création table ${model.name} :`, e?.message || e);
      }
    }
  }

  await createSuperAdmin();

  try {
    await ensureCmsDefaultsSeeded();
  } catch (err) {
    console.error('Erreur initialisation CMS :', err?.message || err);
  }

  try {
    const partenairesCount = await Partenaire.count();
    if (partenairesCount === 0) {
      await Partenaire.bulkCreate([
        { nom: 'RASMA', logo: '/images/partenaires/partenaire2.png', site_web: null, actif: true, ordre: 1 },
        { nom: 'Partenaire 3', logo: '/images/partenaires/partenaire3.png', site_web: null, actif: true, ordre: 2 },
        { nom: 'Partenaire 4', logo: '/images/partenaires/partenaire4.png', site_web: null, actif: true, ordre: 3 },
        { nom: 'Partenaire 5', logo: '/images/partenaires/partenaire5.png', site_web: null, actif: true, ordre: 4 },
        { nom: 'Partenaire 6', logo: '/images/partenaires/partenaire6.png', site_web: null, actif: true, ordre: 5 },
        { nom: 'Partenaire 7', logo: '/images/partenaires/partenaire7.png', site_web: null, actif: true, ordre: 6 },
        { nom: 'Partenaire 8', logo: '/images/partenaires/partenaire8.png', site_web: null, actif: true, ordre: 7 },
      ]);
      console.log('Partenaires par défaut initialisés.');
    }
  } catch (err) {
    console.error('Erreur initialisation partenaires :', err?.message || err);
  }

  try {
    const temoignagesCount = await Temoignage.count();
    if (temoignagesCount === 0) {
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
      console.log('Témoignages par défaut initialisés.');
    }
  } catch (err) {
    console.error('Erreur initialisation témoignages :', err?.message || err);
  }
}

let serverInstance;

const startServer = () => {
  const port = process.env.PORT || 5000;
  serverInstance = app.listen(port, () => {
    console.log(`Serveur disponible sur le port ${port}`);
  });
};

const shutdown = async (signal) => {
  console.log(`Signal ${signal} reçu : fermeture propre du serveur...`);
  if (serverInstance) {
    serverInstance.close(() => {
      console.log('Serveur HTTP fermé.');
    });
  }
  try {
    await sequelize.close();
    console.log('Connexion base de données fermée.');
    process.exit(0);
  } catch (err) {
    console.error('Erreur lors de la fermeture DB :', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Démarrer le serveur HTTP immédiatement pour que Render valide le port sans délai
startServer();

// Puis synchroniser et initialiser la base de données en arrière-plan
syncAndSeedDatabase().catch((err) => {
  console.error('Erreur lors de l’initialisation base de données :', err?.message || err);
});
