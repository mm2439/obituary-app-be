const path = require('path');
const { supabaseAdmin } = require('./supabase');

/**
 * Upload a file (multer file object) to Supabase Storage
 * @param {Object} file - multer file (has buffer, originalname, mimetype)
 * @param {string} bucket - storage bucket name
 * @param {string} keyPrefix - path prefix (e.g., 'obituary-images/slug')
 * @returns {Promise<{path:string, publicUrl:string}>}
 */
async function uploadToSupabase(file, bucket, keyPrefix) {
  const ext = path.extname(file.originalname) || '';
  const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
  const fileName = `${safeBase}-${Date.now()}${ext}`;
  const storagePath = `${keyPrefix}/${fileName}`;

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (error) {
    throw error;
  }

  const { data: publicData } = supabaseAdmin.storage.from(bucket).getPublicUrl(storagePath);

  return { path: storagePath, publicUrl: publicData?.publicUrl || null };
}

module.exports = { uploadToSupabase };

