const { supabaseAdmin } = require('../config/supabase');
const supabaseService = require('../services/supabaseService');
const httpStatus = require("http-status-codes").StatusCodes;
const { getClientIP } = require('../middleware/supabaseAuth');

const activityLogController = {
  // Create activity log entry
  createLog: async (userId, action, entityType, entityId, details = {}, ipAddress = null) => {
    try {
      const log = await supabaseService.create('activityLogs', {
        userId,
        action,
        entityType,
        entityId,
        details,
        ipAddress,
        timestamp: new Date().toISOString()
      });

      return log;
    } catch (error) {
      console.error('Error creating activity log:', error);
      throw error;
    }
  },

  // Get user activity logs
  getUserActivityLogs: async (req, res) => {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 50, entityType, action, startDate, endDate } = req.query;

      let whereClause = { userId };

      if (entityType) {
        whereClause.entityType = entityType;
      }

      if (action) {
        whereClause.action = action;
      }

      const options = {
        where: whereClause,
        order: { field: 'timestamp', ascending: false },
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      };

      let query = supabaseAdmin
        .from('activityLogs')
        .select('*')
        .eq('userId', userId);

      if (entityType) {
        query = query.eq('entityType', entityType);
      }

      if (action) {
        query = query.eq('action', action);
      }

      if (startDate) {
        query = query.gte('timestamp', startDate);
      }

      if (endDate) {
        query = query.lte('timestamp', endDate);
      }

      query = query
        .order('timestamp', { ascending: false })
        .range((parseInt(page) - 1) * parseInt(limit), parseInt(page) * parseInt(limit) - 1);

      const { data: logs, error } = await query;

      if (error) throw error;

      res.status(httpStatus.OK).json({
        success: true,
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: logs.length
        }
      });
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to fetch activity logs'
      });
    }
  },

  // Get admin activity logs (all users)
  getAdminActivityLogs: async (req, res) => {
    try {
      const { page = 1, limit = 100, userId, entityType, action, startDate, endDate } = req.query;

      let query = supabaseAdmin
        .from('activityLogs')
        .select(`
          *,
          profiles!activityLogs_userId_fkey (
            name,
            email,
            role
          )
        `);

      if (userId) {
        query = query.eq('userId', userId);
      }

      if (entityType) {
        query = query.eq('entityType', entityType);
      }

      if (action) {
        query = query.eq('action', action);
      }

      if (startDate) {
        query = query.gte('timestamp', startDate);
      }

      if (endDate) {
        query = query.lte('timestamp', endDate);
      }

      query = query
        .order('timestamp', { ascending: false })
        .range((parseInt(page) - 1) * parseInt(limit), parseInt(page) * parseInt(limit) - 1);

      const { data: logs, error } = await query;

      if (error) throw error;

      res.status(httpStatus.OK).json({
        success: true,
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: logs.length
        }
      });
    } catch (error) {
      console.error('Error fetching admin activity logs:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to fetch admin activity logs'
      });
    }
  },

  // Get activity statistics
  getActivityStats: async (req, res) => {
    try {
      const { startDate, endDate, userId } = req.query;

      let query = supabaseAdmin
        .from('activityLogs')
        .select('action, entityType');

      if (userId) {
        query = query.eq('userId', userId);
      }

      if (startDate) {
        query = query.gte('timestamp', startDate);
      }

      if (endDate) {
        query = query.lte('timestamp', endDate);
      }

      const { data: logs, error } = await query;

      if (error) throw error;

      // Calculate statistics
      const stats = {
        totalActivities: logs.length,
        actionBreakdown: {},
        entityBreakdown: {},
        dailyActivity: {}
      };

      logs.forEach(log => {
        // Action breakdown
        stats.actionBreakdown[log.action] = (stats.actionBreakdown[log.action] || 0) + 1;

        // Entity breakdown
        stats.entityBreakdown[log.entityType] = (stats.entityBreakdown[log.entityType] || 0) + 1;

        // Daily activity (simplified - you might want to group by actual dates)
        const date = new Date(log.timestamp).toDateString();
        stats.dailyActivity[date] = (stats.dailyActivity[date] || 0) + 1;
      });

      res.status(httpStatus.OK).json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Error fetching activity stats:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to fetch activity stats'
      });
    }
  },

  // Middleware to automatically log activities
  logActivity: (action, entityType) => {
    return async (req, res, next) => {
      // Store original res.json to intercept successful responses
      const originalJson = res.json;

      res.json = function(data) {
        // Only log if the response was successful
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const userId = req.user?.id;
          const entityId = req.params?.id || data?.id || null;
          const ipAddress = getClientIP(req);

          if (userId) {
            activityLogController.createLog(
              userId,
              action,
              entityType,
              entityId,
              {
                method: req.method,
                url: req.originalUrl,
                userAgent: req.get('User-Agent'),
                body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined
              },
              ipAddress
            ).catch(error => {
              console.error('Failed to log activity:', error);
            });
          }
        }

        // Call original res.json
        return originalJson.call(this, data);
      };

      next();
    };
  },

  // Get recent activities for dashboard
  getRecentActivities: async (req, res) => {
    try {
      const { limit = 10 } = req.query;

      const { data: logs, error } = await supabaseAdmin
        .from('activityLogs')
        .select(`
          *,
          profiles!activityLogs_userId_fkey (
            name,
            email,
            role
          )
        `)
        .order('timestamp', { ascending: false })
        .limit(parseInt(limit));

      if (error) throw error;

      res.status(httpStatus.OK).json({
        success: true,
        activities: logs
      });
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to fetch recent activities'
      });
    }
  },

  // Clean old logs (for maintenance)
  cleanOldLogs: async (req, res) => {
    try {
      const { daysOld = 90 } = req.query;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysOld));

      const { error } = await supabaseAdmin
        .from('activityLogs')
        .delete()
        .lt('timestamp', cutoffDate.toISOString());

      if (error) throw error;

      res.status(httpStatus.OK).json({
        success: true,
        message: `Cleaned logs older than ${daysOld} days`
      });
    } catch (error) {
      console.error('Error cleaning old logs:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to clean old logs'
      });
    }
  }
};

module.exports = activityLogController;
