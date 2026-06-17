import multer from 'multer';
import { Request } from 'express';

// ─────────────────────────────────────────────
// Use memoryStorage instead of diskStorage.
// Files are held in RAM (file.buffer) and uploaded directly
// to Supabase Storage — nothing is written to the local filesystem.
// ─────────────────────────────────────────────
const storage = multer.memoryStorage();

// File filter — allowed MIME types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimes = [
        // Images
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        // Documents
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',       // .xlsx
        'application/zip',
        'application/x-zip-compressed',
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('نوع الملف غير مسموح به. الأنواع المسموحة: صور، PDF، DOCX، XLSX، ZIP.'));
    }
};

// Create multer upload instance (in-memory, max 10 MB per file)
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
    },
});

// Pre-configured field sets for convenience (used by auth.routes.ts)
export const trainerUploadFields = upload.fields([
    { name: 'cv',           maxCount: 1 },
    { name: 'certificates', maxCount: 5 },
]);

export const instituteUploadFields = upload.fields([
    { name: 'licenseDocument', maxCount: 1 },
]);
