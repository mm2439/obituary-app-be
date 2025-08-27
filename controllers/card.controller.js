const { supabaseAdmin } = require("../config/supabase");
const memoryLogsController = require("./memoryLogs.controller");
const httpStatus = require("http-status-codes").StatusCodes;

const cardController = {
  createCard: async (req, res) => {
    try {
      const { email, obituaryId, cardId } = req.body;

      // Verify user exists
      const { data: user, error: userErr } = await supabaseAdmin
        .from('users')
        .select('id, name')
        .eq('email', email)
        .single();
      if (userErr || !user) {
        return res.status(httpStatus.NOT_FOUND).json({ message: 'No Such User Found' });
      }

      // Check duplicate card
      const { data: existing } = await supabaseAdmin
        .from('cards')
        .select('id')
        .eq('email', email)
        .eq('obituaryId', obituaryId)
        .eq('cardId', cardId)
        .limit(1);
      if (existing && existing.length > 0) {
        return res.status(httpStatus.CONFLICT).json({ message: 'User Already has this card' });
      }

      const payload = { email, userId: user.id, obituaryId: parseInt(obituaryId), cardId };
      const { data: card, error } = await supabaseAdmin
        .from('cards')
        .insert(payload)
        .select()
        .single();
      if (error) return res.status(500).json({ error: 'Something went wrong' });

      await memoryLogsController.createLog('card', obituaryId, user.id, card.id, 'approved', user.name, `MOBI Pogreb ${cardId}`);

      res.status(httpStatus.CREATED).json(card);
    } catch (error) {
      console.error('Error generating card:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Something went wrong' });
    }
  },
};

module.exports = cardController;
