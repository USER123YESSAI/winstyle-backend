import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger d'abord .env.local (prioritaire), puis .env (fallback)
// -> évite les inversions d'ordre qui peuvent laisser DB_PORT sur une mauvaise valeur.
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
    sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER || 'root',
        process.env.DB_PASSWORD || '',
        {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            dialect,
            logging,
        }
    );
}

export default sequelize;
