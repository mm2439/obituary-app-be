const httpStatus = require("http-status-codes").StatusCodes;
const moment = require("moment");
const supabaseService = require("../services/supabaseService");
const { supabaseAdmin } = require("../config/supabase");

const commonController = {
  // Change post status (approve/reject) - Supabase version
  changePostStatus: async (req, res) => {
    try {
      const { interactionId, type, action, logId } = req.body;
      console.log(req.body);

      // Validate input
      const validTypes = ['condolence', 'dedication', 'photo'];
      if (!interactionId || !type || !validTypes.includes(type)) {
        return res
          .status(httpStatus.BAD_REQUEST)
          .json({ error: "Invalid type or interactionId" });
      }

      // Map type to table name (matching your schema)
      const tableMap = {
        'condolence': 'condolences',
        'dedication': 'dedications', 
        'photo': 'photos'
      };

      const tableName = tableMap[type];

      // Find the post
      const post = await supabaseService.findOne(tableName, interactionId);

      if (!post) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ error: "Post not found" });
      }

      // Update post status
      const updatedPost = await supabaseService.update(tableName, interactionId, { 
        status: action 
      });

      // Update memory log if provided
      if (logId) {
        try {
          await supabaseService.update('memorylogs', logId, { 
            status: action 
          });
        } catch (logError) {
          console.error('Error updating memory log:', logError);
          // Don't fail the main operation if log update fails
        }
      }

      console.log(`Post ${interactionId} (${type}) has been ${action}`);

      res.status(httpStatus.OK).json({
        message: `Post successfully ${action}`,
        post: updatedPost,
      });
    } catch (error) {
      console.error("Error approving/denying post:", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Something went wrong" });
    }
  },

  // Get approved posts statistics - Supabase version
  getApprovedPosts: async (req, res) => {
    try {
      const startOfTheMonth = moment().startOf("month").toISOString();
      const endOfTheMonth = moment().endOf("month").toISOString();

      const startOfLastMonth = moment()
        .subtract(1, "month")
        .startOf("month")
        .toISOString();

      const endOfLastMonth = moment()
        .subtract(1, "month")
        .endOf("month")
        .toISOString();

      // Fetch data from Supabase using your exact table names
      const [
        approvedPhotos,
        approvedSorrowBooks,
        approvedCondolences,
        approvedDedications,
        candles,
        memoryPages,
      ] = await Promise.all([
        // Photos with approved status
        supabaseAdmin
          .from('"photos"')
          .select('"createdTimestamp"')
          .eq('status', 'approved')
          .order('createdTimestamp', { ascending: false }),

        // Sorrow books (no status filter in your schema)
        supabaseAdmin
          .from('"sorrowBooks"')
          .select('"createdTimestamp"')
          .order('createdTimestamp', { ascending: false }),

        // Condolences with approved status
        supabaseAdmin
          .from('"condolences"')
          .select('"createdTimestamp"')
          .eq('status', 'approved')
          .order('createdTimestamp', { ascending: false }),

        // Dedications with approved status
        supabaseAdmin
          .from('"dedications"')
          .select('"createdTimestamp"')
          .eq('status', 'approved')
          .order('createdTimestamp', { ascending: false }),

        // Candles (no status filter)
        supabaseAdmin
          .from('"candles"')
          .select('"createdTimestamp"')
          .order('createdTimestamp', { ascending: false }),

        // Obituaries (memory pages)
        supabaseAdmin
          .from('"obituaries"')
          .select('"createdTimestamp"')
          .order('createdTimestamp', { ascending: false }),
      ]);

      // Handle potential errors from Supabase queries
      const getData = (result) => {
        if (result.error) {
          console.error('Supabase query error:', result.error);
          return [];
        }
        return result.data || [];
      };

      const photosData = getData(approvedPhotos);
      const sorrowBooksData = getData(approvedSorrowBooks);
      const condolencesData = getData(approvedCondolences);
      const dedicationsData = getData(approvedDedications);
      const candlesData = getData(candles);
      const memoryPagesData = getData(memoryPages);

      // Function to calculate monthly totals
      function getTotal(entries) {
        let currentMonthCount = 0;
        let lastMonthCount = 0;
        
        if (entries.length === 0) {
          return { currentMonthCount, lastMonthCount };
        }

        entries.forEach((entry) => {
          const createdDate = moment(entry.createdTimestamp);
          
          if (createdDate.isBetween(startOfTheMonth, endOfTheMonth, "day", "[]")) {
            currentMonthCount++;
          }
          
          if (createdDate.isBetween(startOfLastMonth, endOfLastMonth, "day", "[]")) {
            lastMonthCount++;
          }
        });

        return { currentMonthCount, lastMonthCount };
      }

      // Build response matching your existing structure
      const result = {
        photo: {
          total: photosData.length,
          data: getTotal(photosData),
        },
        condolence: {
          total: condolencesData.length,
          data: getTotal(condolencesData),
        },
        dedication: {
          total: dedicationsData.length,
          data: getTotal(dedicationsData),
        },
        sorrowBooks: {
          total: sorrowBooksData.length,
          data: getTotal(sorrowBooksData),
        },
        candle: {
          total: candlesData.length,
          data: getTotal(candlesData),
        },
        memories: {
          total: memoryPagesData.length,
          data: getTotal(memoryPagesData),
        },
      };

      return res.status(httpStatus.OK).json(result);
    } catch (error) {
      console.error("Error fetching approved posts:", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Something went wrong" });
    }
  },

  // Get obituary-specific statistics
  getObituaryStats: async (req, res) => {
    try {
      const { obituaryId } = req.params;

      if (!obituaryId) {
        return res.status(httpStatus.BAD_REQUEST).json({
          error: "Obituary ID is required"
        });
      }

      // Fetch all related data for the obituary
      const [
        photos,
        condolences,
        dedications,
        sorrowBooks,
        candles,
        visits
      ] = await Promise.all([
        supabaseAdmin
          .from('"photos"')
          .select('*')
          .eq('obituaryId', parseInt(obituaryId))
          .eq('status', 'approved'),

        supabaseAdmin
          .from('"condolences"')
          .select('*')
          .eq('obituaryId', parseInt(obituaryId))
          .eq('status', 'approved'),

        supabaseAdmin
          .from('"dedications"')
          .select('*')
          .eq('obituaryId', parseInt(obituaryId))
          .eq('status', 'approved'),

        supabaseAdmin
          .from('"sorrowBooks"')
          .select('*')
          .eq('obituaryId', parseInt(obituaryId)),

        supabaseAdmin
          .from('"candles"')
          .select('*')
          .eq('obituaryId', parseInt(obituaryId)),

        supabaseAdmin
          .from('"visits"')
          .select('*')
          .eq('obituaryId', parseInt(obituaryId))
      ]);

      const result = {
        obituaryId: parseInt(obituaryId),
        stats: {
          photos: getData(photos).length,
          condolences: getData(condolences).length,
          dedications: getData(dedications).length,
          sorrowBooks: getData(sorrowBooks).length,
          candles: getData(candles).length,
          visits: getData(visits).length
        },
        data: {
          photos: getData(photos),
          condolences: getData(condolences),
          dedications: getData(dedications),
          sorrowBooks: getData(sorrowBooks),
          candles: getData(candles),
          visits: getData(visits)
        }
      };

      return res.status(httpStatus.OK).json(result);
    } catch (error) {
      console.error("Error fetching obituary stats:", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Something went wrong" });
    }
  }
};

// Helper function to safely get data from Supabase response
function getData(result) {
  if (result.error) {
    console.error('Supabase query error:', result.error);
    return [];
  }
  return result.data || [];
}

module.exports = commonController;
