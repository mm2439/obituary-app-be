const httpStatus = require("http-status-codes").StatusCodes;
const moment = require("moment");
const { supabaseAdmin } = require("../config/supabase");
const memoryLogsController = require("./memoryLogs.controller");

const condolenceController = {
  createCondolence: async (req, res) => {
    try {
      const { name, message, relation, isCustomMessage, isKeeper } = req.body;
      const userId = req.profile?.id;
      const obituaryId = parseInt(req.params.id);
      if (!userId) return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthorized' });

      if (!name || !message || !relation) {
        return res.status(httpStatus.BAD_REQUEST).json({ error: 'Invalid data format: missing fields' });
      }

      const oneDayAgo = moment().subtract(24, 'hours').toISOString();
      const { data: recent, error: recentErr } = await supabaseAdmin
        .from('condolences')
        .select('id, createdTimestamp')
        .eq('userId', userId)
        .eq('obituaryId', obituaryId)
        .gte('createdTimestamp', oneDayAgo)
        .order('createdTimestamp', { ascending: false })
        .limit(1);
      if (!recentErr && recent && recent.length > 0) {
        return res.status(httpStatus.CONFLICT).json({ error: 'You can only add a condolence once every 24 hours.' });
      }

      const status = isKeeper ? 'approved' : (isCustomMessage ? 'pending' : 'approved');

      const payload = { name, message, relation, isCustomMessage, userId, obituaryId, status, createdTimestamp: new Date().toISOString() };
      const { data: condolence, error } = await supabaseAdmin
        .from('condolences')
        .insert(payload)
        .select()
        .single();
      if (error) {
        console.error('createCondolence insert error:', error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Something went wrong' });
      }

      try {
        await memoryLogsController.createLog(
          "condolence",
          obituaryId,
          userId,
          condolence.id,
          condolence.status,
          condolence.name,
          "Sožalje"
        );
      } catch (logError) {
        console.error("Error creating memory log:", logError);
      }

      res.status(httpStatus.CREATED).json(condolence);
    } catch (error) {
      console.error("Error creating condolence:", error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Something went wrong" });
    }
  },
};

module.exports = condolenceController;
