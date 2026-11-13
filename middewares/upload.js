import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
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

export const deleteUploadedFile = async (fileUrlOrName) => {
    if (!fileUrlOrName) return;
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
