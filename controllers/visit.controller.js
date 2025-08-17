const moment = require("moment");
const { supabaseAdmin } = require("../config/supabase");

const visitController = {
  visitMemory: async (userId = null, ipAddress, obituaryId) => {
    try {
      // Check if there's a visit in last 24 hours for this ip+obituary
      const since = moment().subtract(24, "hours").toISOString();
      const { data: existing, error: findErr } = await supabaseAdmin
        .from('visits')
        .select('id')
        .eq('ipAddress', ipAddress)
        .eq('obituaryId', obituaryId)
        .gte('createdTimestamp', since)
        .limit(1);
      if (!findErr && existing && existing.length > 0) return null;

      const payload = {
        ipAddress,
        userId: userId || null,
        obituaryId,
        expiry: moment().add(24, "hours").toISOString(),
        createdTimestamp: new Date().toISOString()
      };

      const { data, error } = await supabaseAdmin
        .from('visits')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('visit create error:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error("Error :", error);
      throw new Error("Some Error Occured");
    }
  },
};
module.exports = visitController;
