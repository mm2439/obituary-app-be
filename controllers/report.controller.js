const httpStatus = require("http-status-codes").StatusCodes;
const { supabaseAdmin } = require("../config/supabase");

const reportController = {
  addReport: async (req, res) => {
    try {
      const userId = req.profile?.id;
      const obituaryId = parseInt(req.params.id);
      const { name, message } = req.body;

      if (!userId) return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthorized' });
      if (!name || !message) return res.status(httpStatus.BAD_REQUEST).json({ error: 'Invalid data format' });

      const payload = { userId, obituaryId, name, message, createdTimestamp: new Date().toISOString() };
      const { data: report, error } = await supabaseAdmin
        .from('reports')
        .insert(payload)
        .select()
        .single();
      if (error) return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Something went wrong' });

      res.status(httpStatus.CREATED).json(report);
    } catch (error) {
      console.error('Error adding report:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Something went wrong' });
    }
  },
};

module.exports = reportController;
