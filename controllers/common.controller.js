const httpStatus = require("http-status-codes").StatusCodes;
const moment = require("moment");
const { supabaseAdmin } = require("../config/supabase");

const tableByType = { condolence: 'condolences', dedication: 'dedications', photo: 'photos' };

const commonController = {
  changePostStatus: async (req, res) => {
    try {
      const { interactionId, type, action, logId } = req.body;
      if (!interactionId || !type || !tableByType[type]) {
        return res.status(httpStatus.BAD_REQUEST).json({ error: "Invalid type or interactionId" });
      }

      // Update the post item
      const { data: post, error: postErr } = await supabaseAdmin
        .from(tableByType[type])
        .update({ status: action })
        .eq('id', interactionId)
        .select('*')
        .single();
      if (postErr || !post) return res.status(httpStatus.NOT_FOUND).json({ error: 'Post not found' });

      // Update corresponding memory log
      if (logId) {
        await supabaseAdmin
          .from('memorylogs')
          .update({ status: action })
          .eq('id', logId);
      }

      res.status(httpStatus.OK).json({ message: `Post successfully ${action}`, post });
    } catch (error) {
      console.error("Error approving/denying post:", error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Something went wrong" });
    }
  },

  getApprovedPosts: async (_req, res) => {
    try {
      const startOfTheMonth = moment().startOf("month");
      const endOfTheMonth = moment().endOf("month");
      const startOfLastMonth = moment().subtract(1, "month").startOf("month");
      const endOfLastMonth = moment().subtract(1, "month").endOf("month");

      const [photos, sorrowBooks, condolences, dedications, candles, obituaries] = await Promise.all([
        supabaseAdmin.from('photos').select('createdTimestamp').eq('status', 'approved').order('createdTimestamp', { ascending: false }),
        supabaseAdmin.from('sorrowBooks').select('createdTimestamp').order('createdTimestamp', { ascending: false }),
        supabaseAdmin.from('condolences').select('createdTimestamp').eq('status', 'approved').order('createdTimestamp', { ascending: false }),
        supabaseAdmin.from('dedications').select('createdTimestamp').eq('status', 'approved').order('createdTimestamp', { ascending: false }),
        supabaseAdmin.from('candles').select('createdTimestamp').order('createdTimestamp', { ascending: false }),
        supabaseAdmin.from('obituaries').select('createdTimestamp').order('createdTimestamp', { ascending: false })
      ]);

      const getTotal = (rows) => {
        const data = rows?.data || [];
        let currentMonthCount = 0, lastMonthCount = 0;
        data.forEach((entry) => {
          const createdDate = moment(entry.createdTimestamp);
          if (createdDate.isBetween(startOfTheMonth, endOfTheMonth, 'day', '[]')) currentMonthCount++;
          else if (createdDate.isBetween(startOfLastMonth, endOfLastMonth, 'day', '[]')) lastMonthCount++;
        });
        return { currentMonthCount, lastMonthCount };
      };

      const result = {
        condolence: { total: condolences.data?.length || 0, data: getTotal(condolences) },
        photos: { total: photos.data?.length || 0, data: getTotal(photos) },
        dedication: { total: dedications.data?.length || 0, data: getTotal(dedications) },
        sorrowBooks: { total: sorrowBooks.data?.length || 0, data: getTotal(sorrowBooks) },
        candle: { total: candles.data?.length || 0, data: getTotal(candles) },
        memories: { total: obituaries.data?.length || 0, data: getTotal(obituaries) },
      };

      return res.status(httpStatus.OK).json(result);
    } catch (error) {
      console.log(error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error" });
    }
  },
};

module.exports = commonController;
