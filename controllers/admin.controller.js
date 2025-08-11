const { supabaseAdmin } = require('../config/supabase');
const supabaseService = require('../services/supabaseService');
const emailService = require('../services/emailService');
const notificationController = require('./notification.controller');
const activityLogController = require('./activityLog.controller');
const httpStatus = require("http-status-codes").StatusCodes;

const adminController = {
  // Dashboard overview statistics
  getDashboardStats: async (req, res) => {
    try {
      const { timeframe = '30' } = req.query; // days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeframe));

      // Get basic counts
      const [
        totalUsers,
        totalObituaries,
        totalCandles,
        totalCondolences,
        totalPhotos,
        totalVisits
      ] = await Promise.all([
        supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('obituaries').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('candles').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('condolences').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('photos').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('visits').select('*', { count: 'exact', head: true })
      ]);

      // Get recent activity counts
      const recentActivity = await supabaseAdmin
        .from('activityLogs')
        .select('action')
        .gte('timestamp', startDate.toISOString());

      // Get user role breakdown
      const userRoles = await supabaseAdmin
        .from('profiles')
        .select('role')
        .not('role', 'is', null);

      const roleBreakdown = {};
      userRoles.data?.forEach(user => {
        roleBreakdown[user.role] = (roleBreakdown[user.role] || 0) + 1;
      });

      // Get pending approvals
      const pendingObituaries = await supabaseAdmin
        .from('obituaries')
        .select('*', { count: 'exact', head: true })
        .eq('isPublished', false);

      const pendingPhotos = await supabaseAdmin
        .from('photos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const pendingCondolences = await supabaseAdmin
        .from('condolences')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      res.status(httpStatus.OK).json({
        success: true,
        stats: {
          overview: {
            totalUsers: totalUsers.count,
            totalObituaries: totalObituaries.count,
            totalCandles: totalCandles.count,
            totalCondolences: totalCondolences.count,
            totalPhotos: totalPhotos.count,
            totalVisits: totalVisits.count
          },
          userRoles: roleBreakdown,
          pendingApprovals: {
            obituaries: pendingObituaries.count,
            photos: pendingPhotos.count,
            condolences: pendingCondolences.count
          },
          recentActivityCount: recentActivity.data?.length || 0,
          timeframe: parseInt(timeframe)
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to fetch dashboard statistics'
      });
    }
  },

  // Get all users with advanced filtering
  getAllUsers: async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        role, 
        isBlocked, 
        search, 
        sortBy = 'createdTimestamp',
        sortOrder = 'desc'
      } = req.query;

      let query = supabaseAdmin
        .from('profiles')
        .select(`
          *,
          obituaries:obituaries(count),
          candles:candles(count),
          condolences:condolences(count)
        `);

      // Apply filters
      if (role) {
        query = query.eq('role', role);
      }

      if (isBlocked !== undefined) {
        query = query.eq('isBlocked', isBlocked === 'true');
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
      }

      // Apply sorting and pagination
      query = query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range((parseInt(page) - 1) * parseInt(limit), parseInt(page) * parseInt(limit) - 1);

      const { data: users, error } = await query;

      if (error) throw error;

      res.status(httpStatus.OK).json({
        success: true,
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: users.length
        }
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to fetch users'
      });
    }
  },

  // Update user permissions and settings
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Don't allow updating sensitive fields through this endpoint
      delete updateData.id;
      delete updateData.email;
      delete updateData.password;

      const updatedUser = await supabaseService.update('profiles', id, updateData);

      // Log the admin action
      await activityLogController.createLog(
        req.user.id,
        'update_user',
        'user',
        id,
        { updatedFields: Object.keys(updateData) }
      );

      // Send notification to user if blocked/unblocked
      if (updateData.hasOwnProperty('isBlocked')) {
        await notificationController.createNotification(
          id,
          updateData.isBlocked ? 'account_blocked' : 'account_unblocked',
          updateData.isBlocked ? 'Account Blocked' : 'Account Unblocked',
          updateData.isBlocked 
            ? 'Your account has been blocked by an administrator.'
            : 'Your account has been unblocked. You can now access all features.',
          null,
          { adminId: req.user.id }
        );
      }

      res.status(httpStatus.OK).json({
        success: true,
        user: updatedUser
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to update user'
      });
    }
  },

  // Get pending content for approval
  getPendingContent: async (req, res) => {
    try {
      const { type = 'all', page = 1, limit = 20 } = req.query;

      const results = {};

      if (type === 'all' || type === 'obituaries') {
        const { data: obituaries } = await supabaseAdmin
          .from('obituaries')
          .select(`
            *,
            profiles!obituaries_userId_fkey (name, email, role)
          `)
          .eq('isPublished', false)
          .order('createdTimestamp', { ascending: false })
          .limit(parseInt(limit));

        results.obituaries = obituaries || [];
      }

      if (type === 'all' || type === 'photos') {
        const { data: photos } = await supabaseAdmin
          .from('photos')
          .select(`
            *,
            profiles!photos_userId_fkey (name, email),
            obituaries!photos_obituaryId_fkey (name, sirName, slugKey)
          `)
          .eq('status', 'pending')
          .order('createdTimestamp', { ascending: false })
          .limit(parseInt(limit));

        results.photos = photos || [];
      }

      if (type === 'all' || type === 'condolences') {
        const { data: condolences } = await supabaseAdmin
          .from('condolences')
          .select(`
            *,
            profiles!condolences_userId_fkey (name, email),
            obituaries!condolences_obituaryId_fkey (name, sirName, slugKey)
          `)
          .eq('status', 'pending')
          .order('createdTimestamp', { ascending: false })
          .limit(parseInt(limit));

        results.condolences = condolences || [];
      }

      res.status(httpStatus.OK).json({
        success: true,
        pendingContent: results
      });
    } catch (error) {
      console.error('Error fetching pending content:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to fetch pending content'
      });
    }
  },

  // Approve/reject content
  moderateContent: async (req, res) => {
    try {
      const { type, id, action, reason } = req.body; // action: 'approve' or 'reject'

      let table, statusField, result;

      switch (type) {
        case 'obituary':
          table = 'obituaries';
          statusField = 'isPublished';
          result = await supabaseService.update(table, id, {
            [statusField]: action === 'approve',
            publishedAt: action === 'approve' ? new Date().toISOString() : null
          });
          break;

        case 'photo':
        case 'condolence':
        case 'dedication':
          table = type === 'photo' ? 'photos' : 
                 type === 'condolence' ? 'condolences' : 'dedications';
          statusField = 'status';
          result = await supabaseService.update(table, id, {
            [statusField]: action === 'approve' ? 'approved' : 'rejected',
            moderatedAt: new Date().toISOString(),
            moderatedBy: req.user.id,
            moderationReason: reason || null
          });
          break;

        default:
          return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            error: 'Invalid content type'
          });
      }

      // Log the moderation action
      await activityLogController.createLog(
        req.user.id,
        `${action}_${type}`,
        type,
        id,
        { reason, action }
      );

      // Send notification to content owner
      const content = await supabaseService.findOne(table, id);
      if (content && content.userId) {
        await notificationController.createNotification(
          content.userId,
          `${type}_${action}d`,
          `Your ${type} was ${action}d`,
          action === 'approve' 
            ? `Your ${type} has been approved and is now visible.`
            : `Your ${type} was rejected. ${reason ? `Reason: ${reason}` : ''}`,
          id,
          { contentType: type, action, reason }
        );
      }

      res.status(httpStatus.OK).json({
        success: true,
        message: `${type} ${action}d successfully`,
        result
      });
    } catch (error) {
      console.error('Error moderating content:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to moderate content'
      });
    }
  },

  // System settings management
  getSystemSettings: async (req, res) => {
    try {
      const settings = await supabaseService.findAll('systemSettings', {
        order: { field: 'key', ascending: true }
      });

      const settingsObject = {};
      settings.forEach(setting => {
        settingsObject[setting.key] = {
          value: setting.value,
          description: setting.description,
          updatedBy: setting.updatedBy,
          modifiedTimestamp: setting.modifiedTimestamp
        };
      });

      res.status(httpStatus.OK).json({
        success: true,
        settings: settingsObject
      });
    } catch (error) {
      console.error('Error fetching system settings:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to fetch system settings'
      });
    }
  },

  // Update system settings
  updateSystemSettings: async (req, res) => {
    try {
      const { settings } = req.body;
      const updatedSettings = [];

      for (const [key, value] of Object.entries(settings)) {
        let setting = await supabaseService.findByField('systemSettings', 'key', key, { single: true });
        
        if (setting) {
          setting = await supabaseService.update('systemSettings', setting.id, {
            value: JSON.stringify(value),
            updatedBy: req.user.id
          });
        } else {
          setting = await supabaseService.create('systemSettings', {
            key,
            value: JSON.stringify(value),
            updatedBy: req.user.id
          });
        }
        
        updatedSettings.push(setting);
      }

      // Log the settings update
      await activityLogController.createLog(
        req.user.id,
        'update_system_settings',
        'system',
        null,
        { updatedKeys: Object.keys(settings) }
      );

      res.status(httpStatus.OK).json({
        success: true,
        settings: updatedSettings
      });
    } catch (error) {
      console.error('Error updating system settings:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to update system settings'
      });
    }
  }
};

module.exports = adminController;
