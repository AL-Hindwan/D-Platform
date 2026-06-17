import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────
// Supabase client (server-side with service role)
// ─────────────────────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️  SUPABASE_URL أو SUPABASE_SERVICE_ROLE_KEY غير موجودة في متغيرات البيئة');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// ─────────────────────────────────────────────
// Bucket names (configurable via env vars)
// ─────────────────────────────────────────────
const IMAGES_BUCKET = process.env.SUPABASE_IMAGES_BUCKET || 'images';
const FILES_BUCKET  = process.env.SUPABASE_FILES_BUCKET  || 'files';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Generates a unique file name to prevent collisions.
 * Format: {uuid}-{timestamp}{ext}
 */
function generateUniqueFileName(originalName: string): string {
    const ext = path.extname(originalName).toLowerCase();
    return `${uuidv4()}-${Date.now()}${ext}`;
}

/**
 * Determines whether a MIME type is an image.
 */
function isImage(mimetype: string): boolean {
    return mimetype.startsWith('image/');
}

// ─────────────────────────────────────────────
// Core service
// ─────────────────────────────────────────────

export const supabaseStorageService = {
    /**
     * Upload an image file to the images bucket.
     * @param file       - Multer file object (must use memoryStorage)
     * @param folder     - Optional sub-folder inside the bucket (e.g. 'avatars', 'courses')
     * @returns          - Public URL of the uploaded image
     */
    async uploadImage(
        file: Express.Multer.File,
        folder: string = ''
    ): Promise<string> {
        const fileName = generateUniqueFileName(file.originalname);
        const filePath = folder ? `${folder}/${fileName}` : fileName;

        const { error } = await supabase.storage
            .from(IMAGES_BUCKET)
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false,
            });

        if (error) {
            console.error('[Supabase Storage] uploadImage error:', error);
            throw new Error(`فشل في رفع الصورة: ${error.message}`);
        }

        return supabaseStorageService.getPublicUrl(filePath, IMAGES_BUCKET);
    },

    /**
     * Upload a generic file (PDF, DOCX, XLSX, ZIP, etc.) to the files bucket.
     * Images are also accepted here (for payment receipts, certificates, etc.).
     * @param file       - Multer file object (must use memoryStorage)
     * @param folder     - Optional sub-folder (e.g. 'cv', 'certificates', 'receipts')
     * @returns          - Public URL of the uploaded file
     */
    async uploadFile(
        file: Express.Multer.File,
        folder: string = ''
    ): Promise<string> {
        // Route images to images bucket, documents to files bucket
        const bucket = isImage(file.mimetype) ? IMAGES_BUCKET : FILES_BUCKET;
        const fileName = generateUniqueFileName(file.originalname);
        const filePath = folder ? `${folder}/${fileName}` : fileName;

        const { error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false,
            });

        if (error) {
            console.error('[Supabase Storage] uploadFile error:', error);
            throw new Error(`فشل في رفع الملف: ${error.message}`);
        }

        return supabaseStorageService.getPublicUrl(filePath, bucket);
    },

    /**
     * Delete a file from Supabase Storage using its full public URL.
     * Automatically determines the bucket from the URL.
     * @param publicUrl  - Full public URL returned by uploadImage/uploadFile
     */
    async deleteFile(publicUrl: string): Promise<void> {
        if (!publicUrl || !publicUrl.startsWith('http')) {
            // Skip deletion for legacy local paths or empty values
            return;
        }

        try {
            // Extract bucket and path from the public URL
            // URL format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
            const urlObj = new URL(publicUrl);
            const parts = urlObj.pathname.split('/');
            // parts: ['', 'storage', 'v1', 'object', 'public', '<bucket>', ...rest]
            const bucketIndex = parts.indexOf('public') + 1;
            if (bucketIndex === 0 || bucketIndex >= parts.length) {
                console.warn('[Supabase Storage] Could not parse bucket from URL:', publicUrl);
                return;
            }
            const bucket = parts[bucketIndex];
            const filePath = parts.slice(bucketIndex + 1).join('/');

            const { error } = await supabase.storage
                .from(bucket)
                .remove([filePath]);

            if (error) {
                console.error('[Supabase Storage] deleteFile error:', error);
            }
        } catch (err) {
            console.error('[Supabase Storage] deleteFile parse error:', err);
        }
    },

    /**
     * Get the public URL of a file in a given bucket.
     * @param filePath   - Path inside the bucket
     * @param bucket     - Bucket name
     * @returns          - Full public URL
     */
    getPublicUrl(filePath: string, bucket: string = IMAGES_BUCKET): string {
        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return data.publicUrl;
    },
};

export default supabaseStorageService;
