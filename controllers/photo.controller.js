const httpStatus = require("http-status-codes").StatusCodes;
const path = require("path");
const { uploadToSupabase } = require("../config/upload-supabase");
const memoryLogsController = require("./memoryLogs.controller");
const { supabaseAdmin } = require("../config/supabase");

const photoController = {
  addPhoto: async (req, res) => {
    try {
      const userId = req.profile?.id;
      const obituaryId = parseInt(req.params.id);
      const { isKeeper } = req.body;

      if (!userId) return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthorized' });

      let fileUrl = null;
      if (req.files?.picture) {
        const pictureFile = req.files.picture[0];
        // Upload to configured public bucket for photos
        const upload = await uploadToSupabase(pictureFile, 'obituary-photos', `${obituaryId}/${Date.now()}-${pictureFile.originalname}`);
        fileUrl = upload.publicUrl;
      }

      const payload = {
        userId,
        obituaryId,
        fileUrl,
        status: isKeeper ? 'approved' : 'pending',
        createdTimestamp: new Date().toISOString()
      };
      const { data: photo, error } = await supabaseAdmin
        .from('"photos"')
        .insert(payload)
        .select()
        .single();
      if (error) {
        console.error('addPhoto insert error:', error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Something went wrong' });
      }

      try {
        await memoryLogsController.createLog(
          "photo",
          obituaryId,
          userId,
          photo.id,
          photo.status,
          "annonymous",
          "Slika"
        );
      } catch (logError) {
        console.error("Error adding photo log:", logError);
      }

      res.status(httpStatus.CREATED).json(photo);
    } catch (error) {
      console.error("Error adding photo:", error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Something went wrong" });
    }
  },
};

module.exports = photoController;
