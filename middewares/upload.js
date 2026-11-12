import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_MIME_EXTENSIONS = {
    'application/pdf': ['.pdf'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const safeExt = Object.values(ALLOWED_MIME_EXTENSIONS).flat().includes(ext) ? ext : '';
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
    const err = new Error('Format de fichier non autorisé. Formats acceptés : PDF, JPG, PNG, GIF, WEBP.');
    err.status = 400;
    return cb(err, false);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadMultiple = upload.array('images', 10);

export const deleteUploadedFile = async (fileUrlOrName) => {
    if (!fileUrlOrName) return;
    try {
        const filename = path.basename(fileUrlOrName);
        const fullPath = path.join(uploadDir, filename);
        if (fs.existsSync(fullPath)) {
            await fs.promises.unlink(fullPath);
        }
    } catch (err) {
        console.error('Erreur suppression fichier :', err.message);
    }
};

export default upload;
