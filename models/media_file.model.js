import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';

const MediaFile = sequelize.define('MediaFile', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    filename: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
    },
    mimetype: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'application/octet-stream',
    },
    size: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    data: {
        type: DataTypes.TEXT('long'),
        allowNull: false,
    },
}, {
    timestamps: true,
});

export default MediaFile;
