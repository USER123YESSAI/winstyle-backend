import { sequelize, Temoignage } from '../models/index.js';
import { logActivity } from '../middewares/logger.js';
import { deleteUploadedFile, uploadFileToStorage } from '../middewares/upload.js';

let tableSynced = false;
const ensureTemoignageTable = async () => {
    if (tableSynced) return;
    try {
        await Temoignage.sync();
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

// GET /api/temoignages (public — uniquement les témoignages actifs, triés par ordre)
export const getPublicTemoignages = async (req, res) => {
    try {
        await ensureTemoignageTable();
        const temoignages = await Temoignage.findAll({
            where: { actif: true },
            order: [['ordre', 'ASC'], ['id', 'ASC']],
        });
        return res.status(200).json(temoignages);
    } catch (error) {
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};

// GET /api/temoignages/admin (admin — tous les témoignages)
export const getAllTemoignagesAdmin = async (req, res) => {
    try {
        await ensureTemoignageTable();
        const temoignages = await Temoignage.findAll({
            order: [['ordre', 'ASC'], ['id', 'ASC']],
        });
        return res.status(200).json(temoignages);
    } catch (error) {
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};

// POST /api/temoignages (admin)
export const createTemoignage = async (req, res) => {
    let uploadedUrl = null;
    try {
        await ensureTemoignageTable();
        if (req.file) {
            uploadedUrl = await uploadFileToStorage(req.file, 'wins-agency/temoignages');
        }

        const { nom, fonction, entreprise, texte, note, actif, ordre, photo: bodyPhoto } = req.body;
        const photo = uploadedUrl || bodyPhoto || null;

        let targetOrdre = ordre !== undefined && ordre !== '' ? Number(ordre) : null;
        if (targetOrdre === null || Number.isNaN(targetOrdre)) {
            const count = await Temoignage.count();
            targetOrdre = count + 1;
        }

        const temoignage = await Temoignage.create({
            nom: nom.trim(),
            fonction: fonction ? fonction.trim() : null,
            entreprise: entreprise ? entreprise.trim() : null,
            texte: texte.trim(),
            photo,
            note: note ? Math.min(5, Math.max(1, Number(note))) : 5,
            actif: parseBool(actif, true),
            ordre: targetOrdre,
        });

        await logActivity(req.user, 'Témoignage créé', `Témoignage #${temoignage.id} — ${temoignage.nom}`, req);
        return res.status(201).json({ message: 'Témoignage ajouté avec succès', temoignage });
    } catch (error) {
        if (uploadedUrl || req.file) await deleteUploadedFile(uploadedUrl || req.file.filename);
        return res.status(400).json({ message: 'Erreur lors de la création du témoignage', error: error.message });
    }
};

// PUT /api/temoignages/:id (admin)
export const updateTemoignage = async (req, res) => {
    let uploadedUrl = null;
    try {
        await ensureTemoignageTable();
        const temoignage = await Temoignage.findByPk(req.params.id);
        if (!temoignage) {
            if (req.file) await deleteUploadedFile(req.file.filename);
            return res.status(404).json({ message: 'Témoignage introuvable' });
        }

        if (req.file) {
            uploadedUrl = await uploadFileToStorage(req.file, 'wins-agency/temoignages');
        }

        const { nom, fonction, entreprise, texte, note, actif, ordre, photo: bodyPhoto } = req.body;
        const oldPhoto = temoignage.photo;

        let newPhoto = oldPhoto;
        if (uploadedUrl) {
            newPhoto = uploadedUrl;
        } else if (bodyPhoto !== undefined) {
            newPhoto = bodyPhoto || null;
        }

        await temoignage.update({
            ...(nom !== undefined && { nom: nom.trim() }),
            ...(fonction !== undefined && { fonction: fonction ? fonction.trim() : null }),
            ...(entreprise !== undefined && { entreprise: entreprise ? entreprise.trim() : null }),
            ...(texte !== undefined && { texte: texte.trim() }),
            ...(note !== undefined && note !== '' && { note: Math.min(5, Math.max(1, Number(note))) }),
            ...(actif !== undefined && { actif: parseBool(actif, temoignage.actif) }),
            ...(ordre !== undefined && ordre !== '' && { ordre: Number(ordre) }),
            photo: newPhoto,
        });

        if (uploadedUrl && oldPhoto && (oldPhoto.startsWith('/uploads/') || oldPhoto.includes('res.cloudinary.com'))) {
            await deleteUploadedFile(oldPhoto);
        }

        await logActivity(req.user, 'Témoignage modifié', `Témoignage #${temoignage.id} — ${temoignage.nom}`, req);
        return res.status(200).json({ message: 'Témoignage mis à jour', temoignage });
    } catch (error) {
        if (uploadedUrl || req.file) await deleteUploadedFile(uploadedUrl || req.file.filename);
        return res.status(400).json({ message: 'Erreur lors de la mise à jour', error: error.message });
    }
};

// PATCH /api/temoignages/:id/toggle (admin — activer/désactiver)
export const toggleTemoignageActif = async (req, res) => {
    try {
        await ensureTemoignageTable();
        const temoignage = await Temoignage.findByPk(req.params.id);
        if (!temoignage) return res.status(404).json({ message: 'Témoignage introuvable' });

        const nextActif = req.body?.actif !== undefined ? parseBool(req.body.actif) : !temoignage.actif;
        await temoignage.update({ actif: nextActif });

        await logActivity(
            req.user,
            `Témoignage ${nextActif ? 'activé' : 'masqué'}`,
            `Témoignage #${temoignage.id} — ${temoignage.nom}`,
            req
        );

        return res.status(200).json({
            message: `Témoignage ${nextActif ? 'activé' : 'désactivé'}`,
            temoignage,
        });
    } catch (error) {
        return res.status(400).json({ message: 'Erreur lors du changement de statut' });
    }
};

// PATCH /api/temoignages/reorder (admin — réorganiser l'ordre d'affichage)
export const reorderTemoignages = async (req, res) => {
    await ensureTemoignageTable();
    const t = await sequelize.transaction();
    try {
        const { items } = req.body;
        for (const item of items) {
            await Temoignage.update(
                { ordre: Number(item.ordre) },
                { where: { id: Number(item.id) }, transaction: t }
            );
        }
        await t.commit();
        await logActivity(req.user, 'Ordre des témoignages modifié', `${items.length} témoignages réorganisés`, req);
        const temoignages = await Temoignage.findAll({ order: [['ordre', 'ASC'], ['id', 'ASC']] });
        return res.status(200).json({ message: 'Ordre mis à jour', temoignages });
    } catch (error) {
        await t.rollback();
        return res.status(400).json({ message: 'Erreur lors de la réorganisation' });
    }
};

// DELETE /api/temoignages/:id (admin)
export const deleteTemoignage = async (req, res) => {
    try {
        await ensureTemoignageTable();
        const temoignage = await Temoignage.findByPk(req.params.id);
        if (!temoignage) return res.status(404).json({ message: 'Témoignage introuvable' });

        const photoToDelete = temoignage.photo;
        await logActivity(req.user, 'Témoignage supprimé', `Témoignage #${temoignage.id} — ${temoignage.nom}`, req);
        await temoignage.destroy();

        if (photoToDelete && (photoToDelete.startsWith('/uploads/') || photoToDelete.includes('res.cloudinary.com'))) {
            await deleteUploadedFile(photoToDelete);
        }

        return res.status(200).json({ message: 'Témoignage supprimé' });
    } catch (error) {
        return res.status(500).json({ message: 'Erreur lors de la suppression' });
    }
};
