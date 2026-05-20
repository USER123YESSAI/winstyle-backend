import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, ActivityLog } from '../models/index.js';
import { logActivity } from '../middewares/logger.js';

// ── Login ──────────────────────────────────────────────────────────
export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(401).json({ message: 'Identifiants invalides' });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ message: 'Identifiants invalides' });

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.SECRET_KEY,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // Log connexion
        await ActivityLog.create({
            adminId:    user.id,
            adminNom:   user.nom || 'Admin',
            adminEmail: user.email,
            action:     'Connexion au dashboard',
            cible:      null,
            ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '—',
        });

        return res.status(200).json({ message: 'Connexion réussie', token, role: user.role });
    } catch (error) {
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// ── Profil connecté ────────────────────────────────────────────────
export const getMe = async (req, res) => {
    return res.status(200).json({ user: req.user });
};

// ── Créer un admin ─────────────────────────────────────────────────
export const createAdmin = async (req, res) => {
    const { nom, email, password } = req.body;
    try {
        const existing = await User.findOne({ where: { email } });
        if (existing) return res.status(409).json({ message: 'Cet email est déjà utilisé' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = await User.create({ nom, email, password: hashedPassword, role: 'admin' });

        await logActivity(
            req.user,
            'Compte admin créé',
            `Admin #${newAdmin.id} — ${newAdmin.nom} (${newAdmin.email})`,
            req
        );

        return res.status(201).json({
            message: 'Compte admin créé avec succès',
            admin: { id: newAdmin.id, nom: newAdmin.nom, email: newAdmin.email, role: newAdmin.role },
        });
    } catch (error) {
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// ── Liste des admins ───────────────────────────────────────────────
export const getAdmins = async (req, res) => {
    try {
        const admins = await User.findAll({
            where: { role: 'admin' },
            attributes: ['id', 'nom', 'email', 'createdAt'],
            order: [['createdAt', 'DESC']],
        });
        return res.status(200).json(admins);
    } catch (error) {
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// ── Supprimer un admin ─────────────────────────────────────────────
export const deleteAdmin = async (req, res) => {
    try {
        const admin = await User.findOne({ where: { id: req.params.id, role: 'admin' } });
        if (!admin) return res.status(404).json({ message: 'Admin introuvable' });

        await logActivity(
            req.user,
            'Compte admin supprimé',
            `Admin #${admin.id} — ${admin.nom} (${admin.email})`,
            req
        );

        await admin.destroy();
        return res.status(200).json({ message: 'Compte admin supprimé' });
    } catch (error) {
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// ── Logs d'activité (superadmin) ───────────────────────────────────
export const getLogs = async (req, res) => {
    try {
        const logs = await ActivityLog.findAll({
            order: [['createdAt', 'DESC']],
            limit: 200,
        });
        return res.status(200).json(logs);
    } catch (error) {
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};
