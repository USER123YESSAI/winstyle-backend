import app from './app.js';
import dotenv from 'dotenv';
import { sequelize } from './models/index.js';

// Charger le bon .env (pour éviter les cas où dotenv ne trouve pas le fichier)
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger .env seulement si DB_SYNC=false
// (si DB_SYNC=true, on se base surtout sur config/database.js qui charge .env.local en priorité)
dotenv.config({ path: path.join(__dirname, '.env') });



// Synchro SQL: pilotée par l'environnement (évite les erreurs type ER_TABLESPACE_EXISTS quand DB_SYNC n'est pas activé)
// Mettre DB_SYNC=true pour activer explicitement en dev.
const shouldSync = process.env.DB_SYNC === 'true';


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
      // IMPORTANT: sync sur MySQL peut casser selon l'état/les dumps (ER_TABLESPACE_EXISTS).
      // On tente une sync « non destructive ».
      try {
        await sequelize.sync({ alter: false, force: false });
        console.log('Base de données synchronisée (sequelize.sync).');
      } catch (e) {
        // Sur MySQL, sequelize.sync peut échouer si un dump/IMPORT a déjà créé un tablespace.
        // Dans ce cas, tenter alter/force peut encore échouer et bloquer le démarrage.
        // On tolère l'erreur et on démarre l'API (les endpoints échoueront si schéma absent).
        if (e?.original?.code !== 'ER_TABLESPACE_EXISTS') {
          throw e;
        }
        console.warn('ER_TABLESPACE_EXISTS détecté : sequelize.sync ignoré (API démarrée).');
      }

    } else {

    console.log("sequelize.sync désactivé au démarrage (met DB_SYNC=true pour l'activer). ");
    // Note: en production/dev, on préfère gérer le schéma via migrations plutôt que sync automatique.

    // Ne pas bloquer le démarrage si la DB n'est pas joignable.
    // En cas d'indispo, l'API échouera sur les routes DB, mais le serveur reste up.
    try {
      await sequelize.authenticate();
      console.log('Authentification base de données OK (sequelize.authenticate).');
    } catch (e) {
      console.error('DB indisponible (serveur démarré quand même) :', e?.message || e);
    }
    }

    console.log('Connexion base de données OK (ou DB indisponible, serveur démarré).');
    startServer();
  } catch (err) {
    console.error('Erreur de connexion / synchronisation à la base de données :', err);
  }
})();

