import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';

const Realisation = sequelize.define('Realisation', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    titre: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    date: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    categorie: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    images: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: '[]',
    },
}, {
    timestamps: true,
});

export default Realisation;
