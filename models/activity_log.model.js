import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';

const ActivityLog = sequelize.define('ActivityLog', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    adminId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    adminNom: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    adminEmail: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    action: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    cible: {
        type: DataTypes.STRING,
        allowNull: true, 
    },
    ip: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, { timestamps: true, updatedAt: false });

export default ActivityLog;
