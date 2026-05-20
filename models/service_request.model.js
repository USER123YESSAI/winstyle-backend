import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';

const ServiceRequest = sequelize.define('ServiceRequest', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nom: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    entreprise: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    telephone: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    service: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    date_evenement: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
}, { timestamps: true });

export default ServiceRequest;
