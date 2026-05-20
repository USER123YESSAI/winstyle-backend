import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';

const Inscription = sequelize.define('Inscription', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nom: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    telephone: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, { timestamps: true });

export default Inscription;
