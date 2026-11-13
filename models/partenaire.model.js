import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';

const Partenaire = sequelize.define('Partenaire', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nom: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    logo: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    site_web: {
        type: DataTypes.STRING,
        allowNull: true,
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
});

export default Partenaire;
