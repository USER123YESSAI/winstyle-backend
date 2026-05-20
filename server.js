import app from './app.js';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { sequelize } from './models/index.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const shouldSync = process.env.DB_SYNC === 'true';

// ── Création du superadmin au démarrage ──────────────────────────────────────
async function createSuperAdmin() {
  try {
    const { default: User } = await import('./models/User.js');

    const email    = process.env.SUPERADMIN_EMAIL    || 'admin@winstyle.com';
    const password = process.env.SUPERADMIN_PASSWORD || 'Admin@@2025!';
    const nom      = process.env.SUPERADMIN_NOM      || 'Super Admin';

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log(`Superadmin déjà existant (${email}) — aucune action.`);
      return;
    }

    const hash = await bcrypt.hash(password, 10);
    await User.create({ nom, email, password: hash, role: 'superadmin' });
    console.log(`✅ Superadmin créé : ${email}`);
  } catch (err) {
    console.error('Erreur création superadmin :', err?.message || err);
  }
}
// ─────────────────────────────────────────────────────────────────────────────

const startServer = () => {
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Serveur disponible sur le port ${port}`);
  });
};

(async () => {
  try {
    if (shouldSync) {
      console.log('DB_SYNC=true -> sequelize.sync');
      try {
        await sequelize.sync({ alter: false, force: false });
        console.log('Base de données synchronisée (sequelize.sync).');
      } catch (e) {
        if (e?.original?.code !== 'ER_TABLESPACE_EXISTS') throw e;
        console.warn('ER_TABLESPACE_EXISTS détecté : sequelize.sync ignoré (API démarrée).');
      }
    } else {
      console.log("sequelize.sync désactivé au démarrage (met DB_SYNC=true pour l'activer).");
      try {
        await sequelize.authenticate();
        console.log('Authentification base de données OK (sequelize.authenticate).');
      } catch (e) {
        console.error('DB indisponible (serveur démarré quand même) :', e?.message || e);
      }
    }

    await createSuperAdmin();

    console.log('Connexion base de données OK (ou DB indisponible, serveur démarré).');
    startServer();
  } catch (err) {
    console.error('Erreur de connexion / synchronisation à la base de données :', err);
  }
})();