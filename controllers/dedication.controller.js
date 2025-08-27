const httpStatus = require("http-status-codes").StatusCodes;
const { supabaseAdmin } = require("../config/supabase");
const memoryLogsController = require("./memoryLogs.controller");

const dedicationController = {
  createDedication: async (req, res) => {
    try {
      const { title, message, name, isKeeper } = req.body;
      const userId = req.profile?.id;
      const obituaryId = parseInt(req.params.id);
      if (!userId) return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthorized' });

      if (!title || !message || !name) {
        return res.status(httpStatus.BAD_REQUEST).json({ error: 'Invalid data format: missing fields' });
      }

      const payload = {
        title,
        message,
        userId,
        obituaryId,
        name,
        status: isKeeper ? 'approved' : 'pending',
        createdTimestamp: new Date().toISOString()
      };
      const { data: dedication, error } = await supabaseAdmin
        .from('dedications')
        .insert(payload)
        .select()
        .single();
      if (error) {
        console.error('createDedication insert error:', error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Something went wrong' });
      }

      try {
        await memoryLogsController.createLog(
          "dedication",
          obituaryId,
          userId,
          dedication.id,
          dedication.status,
          dedication.name,
          "Posvetilo"
        );
      } catch (logError) {
        console.error("Error creating memory log:", logError);
      }

      res.status(httpStatus.CREATED).json(dedication);
    } catch (error) {
      console.error("Error creating condolence:", error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Something went wrong" });
    }
  },
};

module.exports = dedicationController;
