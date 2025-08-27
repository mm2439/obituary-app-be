const httpStatus = require("http-status-codes").StatusCodes;
const { supabaseAdmin } = require("../config/supabase");
const memoryLogsController = require("./memoryLogs.controller");

const sorrowBookController = {
  createSorrowBook: async (req, res) => {
    try {
      const { name, relation } = req.body;
      const userId = req.profile?.id;
      const obituaryId = parseInt(req.params.id);

      if (!userId) return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthorized' });
      if (!name || !relation) return res.status(httpStatus.BAD_REQUEST).json({ error: 'Invalid data format: missing fields' });

      // Check if user already added a name
      const { data: existing, error: existErr } = await supabaseAdmin
        .from('sorrowBooks')
        .select('id')
        .eq('userId', userId)
        .eq('obituaryId', obituaryId)
        .limit(1);
      if (!existErr && existing && existing.length > 0) {
        return res.status(httpStatus.CONFLICT).json({ error: 'You have already added a name to this sorrow book.' });
      }

      const payload = { name, relation, userId, obituaryId, createdTimestamp: new Date().toISOString(), status: 'approved' };
      const { data: sorrowBook, error } = await supabaseAdmin
        .from('sorrowBooks')
        .insert(payload)
        .select()
        .single();
      if (error) {
        console.error('createSorrowBook insert error:', error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Something went wrong' });
      }

      try {
        await memoryLogsController.createLog(
          "sorrowbook",
          obituaryId,
          userId,
          sorrowBook.id,
          "approved",
          sorrowBook.name,
          "Žalna knjiga"
        );
      } catch (logError) {
        console.error("Error creating memory log:", logError);
      }

      res.status(httpStatus.CREATED).json(sorrowBook);
    } catch (error) {
      console.error("Error creating sorrow book:", error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Something went wrong" });
    }
  },
};

module.exports = sorrowBookController;
