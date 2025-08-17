const moment = require("moment");
const { supabaseAdmin } = require("../config/supabase");

const candleController = {
  burnCandle: async (req, res) => {
    try {
      const { userId } = req.body;
      const obituaryId = parseInt(req.params.id);

      const ip = req.headers["x-forwarded-for"]?.split(",")[0]
        || req.connection.remoteAddress
        || req.socket.remoteAddress
        || req.ip;
      const ipAddress = (ip && ip.includes("::ffff:")) ? ip.split("::ffff:")[1] : ip;

      const since = moment().subtract(24, "hours").toISOString();
      const { data: existing, error: existingErr } = await supabaseAdmin
        .from('candles')
        .select('id')
        .eq('ipAddress', ipAddress)
        .eq('obituaryId', obituaryId)
        .gte('createdTimestamp', since)
        .limit(1);

      if (!existingErr && existing && existing.length > 0) {
        return res.status(409).json({ message: "You can only burn one candle per 24 hours." });
      }

      const payload = {
        ipAddress,
        userId: userId || null,
        obituaryId,
        expiry: moment().add(24, "hours").toISOString(),
        createdTimestamp: new Date().toISOString()
      };

      const { data: newCandle, error } = await supabaseAdmin
        .from('candles')
        .insert(payload)
        .select()
        .single();
      if (error) {
        console.error('burnCandle insert error:', error);
        return res.status(500).json({ message: 'Internal server error.' });
      }

      // Increment totalCandles safely
      const { data: obit } = await supabaseAdmin
        .from('obituaries')
        .select('totalCandles')
        .eq('id', obituaryId)
        .single();
      await supabaseAdmin
        .from('obituaries')
        .update({ totalCandles: ((obit?.totalCandles || 0) + 1) })
        .eq('id', obituaryId);

      return res.status(201).json({ message: "Candle burned successfully.", candle: newCandle });
    } catch (error) {
      console.error("Error burning candle:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  },
};
module.exports = candleController;
