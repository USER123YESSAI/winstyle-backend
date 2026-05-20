import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';

const Formation = sequelize.define('Formation', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    lieu: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    prix: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    places_disponibles: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 20,
    },
}, { timestamps: true });

export default Formation;
