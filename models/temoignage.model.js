import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';

const Temoignage = sequelize.define('Temoignage', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nom: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    fonction: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    entreprise: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    texte: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    photo: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    note: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5,
    },
    actif: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    ordre: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
}, {
    timestamps: true,
    indexes: [
        { fields: ['actif', 'ordre'] },
    ],
});

export default Temoignage;
