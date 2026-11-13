import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// En environnement de test ou de production (Render), ne pas écraser les variables avec .env.local
if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
  dotenv.config({ path: path.join(__dirname, '..', '.env') });
} else if (process.env.NODE_ENV === 'production' && !process.env.DB_HOST) {
  dotenv.config({ path: path.join(__dirname, '..', '.env') });
}

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
  // DB_SSL=true → SSL activé (requis pour TiDB Cloud serverless)
  const dbSslEnabled =
    process.env.DB_SSL === 'true' || process.env.DB_SSL === '1';

  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      dialect,
      logging,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      ...(dbSslEnabled && {
        dialectOptions: {
          ssl: {
            rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false' ? false : true,
          },
        },
      }),
    }
  );
}

export default sequelize;
