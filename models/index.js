import sequelize from '../config/database.js';
import User from './user.model.js';
import Formation from './formation.model.js';
import Inscription from './inscription.model.js';
import Candidature from './candidature.model.js';
import ServiceRequest from './service_request.model.js';
import Contact from './contact.model.js';
import ActivityLog from './activity_log.model.js';
import Realisation from './realisation.model.js';

// Associations
Formation.hasMany(Inscription, { foreignKey: 'formationId' });
Inscription.belongsTo(Formation, { foreignKey: 'formationId' });

// Log lié à l'admin
User.hasMany(ActivityLog, { foreignKey: 'adminId' });
ActivityLog.belongsTo(User, { foreignKey: 'adminId' });

export { sequelize, User, Formation, Inscription, Candidature, ServiceRequest, Contact, ActivityLog, Realisation };
