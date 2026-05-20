import { ActivityLog } from '../models/index.js';

/**
 * Enregistre une action admin dans les logs
 * @param {object} user  - req.user (admin connecté)
 * @param {string} action - description de l'action
 * @param {string} cible  - élément ciblé (optionnel)
 * @param {object} req   - requête Express (pour l'IP)
 */
export const logActivity = async (user, action, cible = null, req = null) => {
    try {
        const ip = req
            ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '—')
            : '—';

        await ActivityLog.create({
            adminId:    user.id,
            adminNom:   user.nom || 'Admin',
            adminEmail: user.email,
            action,
            cible,
            ip,
        });
    } catch (err) {
        // Ne jamais bloquer l'action principale si le log échoue
        console.error('Erreur log activité :', err.message);
    }
};
