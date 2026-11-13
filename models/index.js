import sequelize from '../config/database.js';
import User from './user.model.js';
import Formation from './formation.model.js';
import Inscription from './inscription.model.js';
import Candidature from './candidature.model.js';
import ServiceRequest from './service_request.model.js';
import Contact from './contact.model.js';
import ActivityLog from './activity_log.model.js';
import Realisation from './realisation.model.js';
import Partenaire from './partenaire.model.js';
import Temoignage from './temoignage.model.js';
import CmsSection from './cms_section.model.js';
import MediaFile from './media_file.model.js';

// Associations
Formation.hasMany(Inscription, { foreignKey: 'formationId', onDelete: 'CASCADE' });
Inscription.belongsTo(Formation, { foreignKey: 'formationId', onDelete: 'CASCADE' });

// Log lié à l'admin
User.hasMany(ActivityLog, { foreignKey: 'adminId', onDelete: 'SET NULL' });
ActivityLog.belongsTo(User, { foreignKey: 'adminId', onDelete: 'SET NULL' });

export {
    sequelize,
    User,
    Formation,
    Inscription,
    Candidature,
    ServiceRequest,
    Contact,
    ActivityLog,
    Realisation,
    Partenaire,
    Temoignage,
    CmsSection,
    MediaFile,
};
