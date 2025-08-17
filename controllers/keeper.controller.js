const httpStatus = require("http-status-codes").StatusCodes;
const { supabaseAdmin } = require("../config/supabase");
const { uploadToSupabase } = require("../config/upload-supabase");
const path = require("path");
const fs = require("fs");
const memoryLogsController = require("./memoryLogs.controller");
const KEEPER_DEATH_DOCS = path.join(__dirname, "../keeperDocs");

const keeperController = {
  assignKeeper: async (req, res) => {
    try {
      const { email, obituaryId, time, relation, name } = req.body;

      if (!email || !obituaryId || !time) {
        return res.status(httpStatus.BAD_REQUEST).json({ error: "User ID and Obituary ID are required" });
      }

      const { data: user, error: userErr } = await supabaseAdmin
        .from('"users"')
        .select('id, email')
        .eq('email', email)
        .single();
      if (userErr || !user) {
        return res.status(httpStatus.NOT_FOUND).json({ error: "User not found" });
      }
      const userId = user.id;

      const { data: existingKeeper, error: existErr } = await supabaseAdmin
        .from('"keepers"')
        .select('id')
        .eq('userId', userId)
        .eq('obituaryId', obituaryId)
        .limit(1);
      if (!existErr && existingKeeper && existingKeeper.length > 0) {
        return res.status(httpStatus.CONFLICT).json({ error: "User is already assigned as a keeper for this obituary" });
      }

      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 60);

      const payload = { userId, obituaryId: parseInt(obituaryId), expiry: expiry.toISOString(), relation, name };
      const { data: keeper, error } = await supabaseAdmin
        .from('"keepers"')
        .insert(payload)
        .select()
        .single();
      if (error) {
        console.error('assignKeeper insert error:', error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Something went wrong' });
      }

      // Upload optional death report to storage
      if (req.files?.deathReport) {
        const file = req.files.deathReport[0];
        try {
          const upload = await uploadToSupabase(file, 'private-documents', `keeper-death-reports/${keeper.id}`);
          await supabaseAdmin.from('"keepers"').update({ deathReport: upload.publicUrl }).eq('id', keeper.id);
        } catch (e) { console.error('keeper death report upload error:', e); }
      }

      await memoryLogsController.createLog(
        "keeper_activation",
        parseInt(obituaryId),
        userId,
        keeper.id,
        "approved",
        name,
        "Skrbnik"
      );

      res.status(httpStatus.CREATED).json({ message: "Keeper assigned successfully", keeper });
    } catch (error) {
      console.error("Error assigning keeper:", error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Something went wrong" });
    }
  },
};

module.exports = keeperController;
