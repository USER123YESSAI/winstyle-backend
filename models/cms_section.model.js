import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';

const CmsSection = sequelize.define('CmsSection', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    section_key: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
    },
    title: {
        type: DataTypes.STRING(200),
        allowNull: false,
    },
    actif: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    statut: {
        type: DataTypes.ENUM('publie', 'brouillon'),
        allowNull: false,
        defaultValue: 'publie',
    },
    ordre: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    content: {
        type: DataTypes.JSON,
        allowNull: false,
        get() {
            const raw = this.getDataValue('content');
            if (typeof raw === 'string') {
                try { return JSON.parse(raw); } catch { return {}; }
            }
            return raw ?? {};
        },
    },
    draft_content: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
        get() {
            const raw = this.getDataValue('draft_content');
            if (!raw) return null;
            if (typeof raw === 'string') {
                try { return JSON.parse(raw); } catch { return null; }
            }
            return raw;
        },
    },
    updatedBy: {
        type: DataTypes.STRING(150),
        allowNull: true,
    },
}, {
    timestamps: true,
});

export default CmsSection;
