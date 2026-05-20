import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';

const Candidature = sequelize.define('Candidature', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nom: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    telephone: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    poste: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    cv_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    statut: {
        type: DataTypes.ENUM('en attente', 'acceptée', 'refusée'),
        defaultValue: 'en attente',
    },
}, { timestamps: true });

export default Candidature;
