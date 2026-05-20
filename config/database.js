import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const dialect = process.env.DB_DIALECT || 'mysql';
const logging = false;

let sequelize;

if (dialect === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || ':memory:',
    logging,
  });
} else {
  // DB_SSL=true  →  SSL activé (requis pour TiDB Cloud serverless)
  // DB_SSL=false ou absent  →  pas de SSL (dev local)
  const dbSslEnabled =
    process.env.DB_SSL === 'true' || process.env.DB_SSL === '1';

  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host:    process.env.DB_HOST || 'localhost',
      port:    Number(process.env.DB_PORT) || 3306,
      dialect,
      logging,
      ...(dbSslEnabled && {
        dialectOptions: {
          ssl: {
            // TiDB Cloud serverless utilise un CA reconnu par Node.js (ISRG Root X1).
            // rejectUnauthorized: true valide le certificat du serveur (plus sûr).
            // Mets false uniquement si tu obtiens une erreur de certificat.
            rejectUnauthorized: true,
          },
        },
      }),
    }
  );
}

export default sequelize;