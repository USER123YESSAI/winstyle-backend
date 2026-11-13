import { sequelize, Partenaire } from '../models/index.js';
import { logActivity } from '../middewares/logger.js';
import { deleteUploadedFile, persistUploadedFile } from '../middewares/upload.js';

let tableSynced = false;
const ensurePartenaireTable = async () => {
    if (tableSynced) return;
    try {
        await Partenaire.sync();
        tableSynced = true;
    } catch {}
};

const parseBool = (val, defaultVal = true) => {
    if (val === undefined || val === null || val === '') return defaultVal;
    if (typeof val === 'boolean') return val;
    if (val === 'true' || val === '1' || val === 1) return true;
    if (val === 'false' || val === '0' || val === 0) return false;
    return Boolean(val);
};

// GET /api/partenaires (public — uniquement les partenaires actifs, triés par ordre)
export const getPublicPartenaires = async (req, res) => {
    try {
        await ensurePartenaireTable();
        const partenaires = await Partenaire.findAll({
            where: { actif: true },
            order: [['ordre', 'ASC'], ['id', 'ASC']],
        });
        return res.status(200).json(partenaires);
    } catch (error) {
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};

// GET /api/partenaires/admin (admin — tous les partenaires)
export const getAllPartenairesAdmin = async (req, res) => {
    try {
        await ensurePartenaireTable();
        const partenaires = await Partenaire.findAll({
            order: [['ordre', 'ASC'], ['id', 'ASC']],
        });
        return res.status(200).json(partenaires);
    } catch (error) {
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};

// POST /api/partenaires (admin)
export const createPartenaire = async (req, res) => {
    try {
        await ensurePartenaireTable();
        if (req.file) await persistUploadedFile(req.file);

        const { nom, site_web, actif, ordre, logo: bodyLogo } = req.body;
        const logo = req.file ? `/uploads/${req.file.filename}` : (bodyLogo || null);

        let targetOrdre = ordre !== undefined && ordre !== '' ? Number(ordre) : null;
        if (targetOrdre === null || Number.isNaN(targetOrdre)) {
            const count = await Partenaire.count();
            targetOrdre = count + 1;
        }

        const partenaire = await Partenaire.create({
            nom: nom.trim(),
            logo,
            site_web: site_web ? site_web.trim() : null,
            actif: parseBool(actif, true),
            ordre: targetOrdre,
        });

        await logActivity(req.user, 'Partenaire créé', `Partenaire #${partenaire.id} — ${partenaire.nom}`, req);
        return res.status(201).json({ message: 'Partenaire ajouté avec succès', partenaire });
    } catch (error) {
        if (req.file) await deleteUploadedFile(req.file.filename);
        return res.status(400).json({ message: 'Erreur lors de la création du partenaire', error: error.message });
    }
};

// PUT /api/partenaires/:id (admin)
export const updatePartenaire = async (req, res) => {
    try {
        await ensurePartenaireTable();
        const partenaire = await Partenaire.findByPk(req.params.id);
        if (!partenaire) {
            if (req.file) await deleteUploadedFile(req.file.filename);
            return res.status(404).json({ message: 'Partenaire introuvable' });
        }

        if (req.file) await persistUploadedFile(req.file);

        const { nom, site_web, actif, ordre, logo: bodyLogo } = req.body;
        const oldLogo = partenaire.logo;

        let newLogo = oldLogo;
        if (req.file) {
            newLogo = `/uploads/${req.file.filename}`;
        } else if (bodyLogo !== undefined && bodyLogo !== '') {
            newLogo = bodyLogo;
        }

        await partenaire.update({
            ...(nom !== undefined && { nom: nom.trim() }),
            ...(site_web !== undefined && { site_web: site_web ? site_web.trim() : null }),
            ...(actif !== undefined && { actif: parseBool(actif, partenaire.actif) }),
            ...(ordre !== undefined && ordre !== '' && { ordre: Number(ordre) }),
            logo: newLogo,
        });

        if (req.file && oldLogo && oldLogo.startsWith('/uploads/')) {
            await deleteUploadedFile(oldLogo);
        }

        await logActivity(req.user, 'Partenaire modifié', `Partenaire #${partenaire.id} — ${partenaire.nom}`, req);
        return res.status(200).json({ message: 'Partenaire mis à jour', partenaire });
    } catch (error) {
        if (req.file) await deleteUploadedFile(req.file.filename);
        return res.status(400).json({ message: 'Erreur lors de la mise à jour', error: error.message });
    }
};

// PATCH /api/partenaires/:id/toggle (admin — activer/désactiver)
export const togglePartenaireActif = async (req, res) => {
    try {
        await ensurePartenaireTable();
        const partenaire = await Partenaire.findByPk(req.params.id);
        if (!partenaire) return res.status(404).json({ message: 'Partenaire introuvable' });

        const nextActif = req.body?.actif !== undefined ? parseBool(req.body.actif) : !partenaire.actif;
        await partenaire.update({ actif: nextActif });

        await logActivity(
            req.user,
            `Partenaire ${nextActif ? 'activé' : 'masqué'}`,
            `Partenaire #${partenaire.id} — ${partenaire.nom}`,
            req
        );

        return res.status(200).json({
            message: `Partenaire ${nextActif ? 'activé' : 'désactivé'}`,
            partenaire,
        });
    } catch (error) {
        return res.status(400).json({ message: 'Erreur lors du changement de statut' });
    }
};

// PATCH /api/partenaires/reorder (admin — réorganiser l'ordre d'affichage)
export const reorderPartenaires = async (req, res) => {
    await ensurePartenaireTable();
    const t = await sequelize.transaction();
    try {
        const { items } = req.body;
        for (const item of items) {
            await Partenaire.update(
                { ordre: Number(item.ordre) },
                { where: { id: Number(item.id) }, transaction: t }
            );
        }
        await t.commit();
        await logActivity(req.user, 'Ordre des partenaires modifié', `${items.length} partenaires réorganisés`, req);
        const partenaires = await Partenaire.findAll({ order: [['ordre', 'ASC'], ['id', 'ASC']] });
        return res.status(200).json({ message: 'Ordre mis à jour', partenaires });
    } catch (error) {
        await t.rollback();
        return res.status(400).json({ message: 'Erreur lors de la réorganisation' });
    }
};

// DELETE /api/partenaires/:id (admin)
export const deletePartenaire = async (req, res) => {
    try {
        await ensurePartenaireTable();
        const partenaire = await Partenaire.findByPk(req.params.id);
        if (!partenaire) return res.status(404).json({ message: 'Partenaire introuvable' });

        const logoToDelete = partenaire.logo;
        await logActivity(req.user, 'Partenaire supprimé', `Partenaire #${partenaire.id} — ${partenaire.nom}`, req);
        await partenaire.destroy();

        if (logoToDelete && logoToDelete.startsWith('/uploads/')) {
            await deleteUploadedFile(logoToDelete);
        }

        return res.status(200).json({ message: 'Partenaire supprimé' });
    } catch (error) {
        return res.status(500).json({ message: 'Erreur lors de la suppression' });
    }
};
