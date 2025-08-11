const multer = require("multer");
const { supabaseAdmin } = require('./supabase');

// Configure multer to store files in memory
const storage = multer.memoryStorage();

const generateFileName = (file, userId = null) => {
  const timestamp = Date.now();
  const extension = file.originalname.split('.').pop();
  const baseName = file.originalname.split('.').slice(0, -1).join('.');
  const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '-');
  
  if (userId) {
    return `${userId}/${timestamp}-${sanitizedBaseName}.${extension}`;
  }
  return `${timestamp}-${sanitizedBaseName}.${extension}`;
};

// Upload file to Supabase Storage
const uploadToSupabase = async (file, bucketName = 'obituary-photos', userId = null) => {
  try {
    const fileName = generateFileName(file, userId);
    
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return {
      success: true,
      fileName: fileName,
      publicUrl: urlData.publicUrl,
      path: data.path
    };
  } catch (error) {
    console.error('Supabase upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Delete file from Supabase Storage
const deleteFromSupabase = async (fileName, bucketName = 'obituary-photos') => {
  try {
    const { error } = await supabaseAdmin.storage
      .from(bucketName)
      .remove([fileName]);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Supabase delete error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Middleware for handling obituary uploads
const obituaryUploadsFields = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    if (file.fieldname === 'cardImages') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for cardImages'), false);
      }
    } else if (file.fieldname === 'cardPdfs') {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed for cardPdfs'), false);
      }
    } else {
      cb(new Error('Unexpected field'), false);
    }
  }
}).fields([
  { name: "cardImages", maxCount: 5 },
  { name: "cardPdfs", maxCount: 5 },
]);

// Middleware for single photo uploads
const singlePhotoUpload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
}).single('photo');

// Helper function to process uploaded files and save to Supabase
const processObituaryUploads = async (files, userId) => {
  const results = {
    cardImages: [],
    cardPdfs: [],
    errors: []
  };

  // Process card images
  if (files.cardImages) {
    for (const file of files.cardImages) {
      const uploadResult = await uploadToSupabase(file, 'obituary-photos', userId);
      if (uploadResult.success) {
        results.cardImages.push({
          fileName: uploadResult.fileName,
          publicUrl: uploadResult.publicUrl,
          originalName: file.originalname
        });
      } else {
        results.errors.push(`Failed to upload ${file.originalname}: ${uploadResult.error}`);
      }
    }
  }

  // Process card PDFs
  if (files.cardPdfs) {
    for (const file of files.cardPdfs) {
      const uploadResult = await uploadToSupabase(file, 'obituary-photos', userId);
      if (uploadResult.success) {
        results.cardPdfs.push({
          fileName: uploadResult.fileName,
          publicUrl: uploadResult.publicUrl,
          originalName: file.originalname
        });
      } else {
        results.errors.push(`Failed to upload ${file.originalname}: ${uploadResult.error}`);
      }
    }
  }

  return results;
};

// Helper function to process single photo upload
const processSinglePhotoUpload = async (file, userId) => {
  if (!file) {
    return { success: false, error: 'No file provided' };
  }

  return await uploadToSupabase(file, 'obituary-photos', userId);
};

// Get file URL from Supabase Storage
const getFileUrl = (fileName, bucketName = 'obituary-photos') => {
  const { data } = supabaseAdmin.storage
    .from(bucketName)
    .getPublicUrl(fileName);
  
  return data.publicUrl;
};

// Legacy function for backward compatibility
const dbUploadObituaryTemplateCardsPath = (filename) => {
  // Return Supabase URL instead of local path
  return getFileUrl(filename);
};

module.exports = {
  obituaryUploadsFields,
  singlePhotoUpload,
  uploadToSupabase,
  deleteFromSupabase,
  processObituaryUploads,
  processSinglePhotoUpload,
  getFileUrl,
  dbUploadObituaryTemplateCardsPath, // Legacy compatibility
  generateFileName
};
