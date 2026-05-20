import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

// ── Vérifie le token JWT ───────────────────────────────────────────
export const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token manquant ou invalide' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const user = await User.findByPk(decoded.id);
        if (!user) return res.status(401).json({ message: 'Utilisateur introuvable' });
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token invalide ou expiré' });
    }
};

// ── Vérifie que l'utilisateur est superadmin ───────────────────────
export const isSuperAdmin = (req, res, next) => {
    if (req.user?.role !== 'superadmin') {
        return res.status(403).json({ message: 'Accès réservé au super administrateur' });
    }
    next();
};
