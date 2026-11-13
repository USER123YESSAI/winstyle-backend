import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import MediaFile from '../models/media_file.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const uploadDir = path.join(__dirname, '..', 'uploads');

try {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
} catch (err) {
    console.warn('Avertissement création dossier uploads :', err.message);
}

export const isCloudinaryConfigured = () => Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

const configureCloudinary = () => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
    });
};

const ALLOWED_MIME_EXTENSIONS = {
    'application/pdf': ['.pdf'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/jpg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'image/svg+xml': ['.svg'],
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        try {
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
        } catch {}
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const safeExt = Object.values(ALLOWED_MIME_EXTENSIONS).flat().includes(ext) ? ext : '.jpg';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + safeExt);
    },
});

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ALLOWED_MIME_EXTENSIONS[file.mimetype];

    if (allowedExts && allowedExts.includes(ext)) {
        return cb(null, true);
    }
    const err = new Error('Format de fichier non autorisé. Formats acceptés : PDF, JPG, PNG, GIF, WEBP, SVG.');
    err.status = 400;
    return cb(err, false);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 8 * 1024 * 1024 },
});

export const uploadMultiple = upload.array('images', 10);

let mediaTableSynced = false;
const ensureMediaTable = async () => {
    if (mediaTableSynced) return;
    try {
        await MediaFile.sync();
        mediaTableSynced = true;
    } catch (err) {
        console.warn('Avertissement sync MediaFile :', err.message);
    }
};

export const persistUploadedFile = async (file) => {
    if (!file || !file.filename) return;
    try {
        await ensureMediaTable();
        const filePath = file.path || path.join(uploadDir, file.filename);
        if (!fs.existsSync(filePath)) return;
        const buffer = await fs.promises.readFile(filePath);
        const base64Data = buffer.toString('base64');
        await MediaFile.upsert({
            filename: file.filename,
            mimetype: file.mimetype || 'application/octet-stream',
            size: file.size || buffer.length,
            data: base64Data,
        });
    } catch (err) {
        console.warn('Avertissement persistance DB fichier :', err.message);
    }
};

export const persistUploadedFiles = async (files) => {
    if (!Array.isArray(files) || files.length === 0) return;
    for (const file of files) {
        await persistUploadedFile(file);
    }
};

/**
 * Téléverse un fichier vers Cloudinary (si configuré) avec optimisation auto,
 * sinon le persiste en base + disque local et retourne `/uploads/<filename>`.
 */
export const uploadFileToStorage = async (file, folder = 'wins-agency') => {
    if (!file) return null;

    if (isCloudinaryConfigured()) {
        configureCloudinary();
        const filePath = file.path || path.join(uploadDir, file.filename);
        const isPdf = file.mimetype === 'application/pdf' || file.originalname?.toLowerCase().endsWith('.pdf');
        const isSvg = file.mimetype === 'image/svg+xml' || file.originalname?.toLowerCase().endsWith('.svg');

        const result = await cloudinary.uploader.upload(filePath, {
            folder,
            resource_type: isPdf ? 'raw' : 'image',
            use_filename: false,
            unique_filename: true,
        });

        // Nettoyer le fichier temporaire sur le disque local
        try {
            if (fs.existsSync(filePath)) {
                await fs.promises.unlink(filePath);
            }
        } catch {}

        // Optimisation automatique (WebP/AVIF + qualité auto) pour les images raster
        if (!isPdf && !isSvg && result.secure_url.includes('/upload/')) {
            return result.secure_url.replace('/upload/', '/upload/f_auto,q_auto/');
        }
        return result.secure_url;
    }

    await persistUploadedFile(file);
    return `/uploads/${file.filename}`;
};

export const uploadFilesToStorage = async (files, folder = 'wins-agency') => {
    if (!Array.isArray(files) || files.length === 0) return [];
    const urls = [];
    for (const file of files) {
        const url = await uploadFileToStorage(file, folder);
        if (url) urls.push(url);
    }
    return urls;
};

const extractCloudinaryPublicId = (url) => {
    try {
        const cleanUrl = url.split('?')[0];
        const parts = cleanUrl.split('/upload/');
        if (parts.length < 2) return null;
        const segments = parts[1].split('/').filter(Boolean);
        // Retirer les segments de transformation (ex: f_auto,q_auto) et de version (ex: v123456)
        const filtered = segments.filter((seg, idx) => {
            if (idx === 0 && seg.includes(',')) return false;
            if (/^v\d+$/.test(seg)) return false;
            return true;
        });
        const joined = filtered.join('/');
        return joined.replace(/\.[^/.]+$/, '');
    } catch {
        return null;
    }
};

export const deleteUploadedFile = async (fileUrlOrName) => {
    if (!fileUrlOrName) return;

    if (fileUrlOrName.includes('res.cloudinary.com') && isCloudinaryConfigured()) {
        try {
            configureCloudinary();
            const publicId = extractCloudinaryPublicId(fileUrlOrName);
            if (publicId) {
                const isRaw = fileUrlOrName.includes('/raw/upload/') || fileUrlOrName.toLowerCase().endsWith('.pdf');
                await cloudinary.uploader.destroy(publicId, {
                    resource_type: isRaw ? 'raw' : 'image',
                });
            }
        } catch (err) {
            console.warn('Avertissement suppression Cloudinary :', err.message);
        }
        return;
    }

    const filename = path.basename(fileUrlOrName);
    try {
        const fullPath = path.join(uploadDir, filename);
        if (fs.existsSync(fullPath)) {
            await fs.promises.unlink(fullPath);
        }
    } catch (err) {
        console.error('Erreur suppression fichier disque :', err.message);
    }
    try {
        await ensureMediaTable();
        await MediaFile.destroy({ where: { filename } });
    } catch {}
};

export default upload;
