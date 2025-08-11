const { supabaseAdmin } = require('../config/supabase');
const supabaseService = require('../services/supabaseService');
const httpStatus = require("http-status-codes").StatusCodes;

const notificationController = {
  // Create notification
  createNotification: async (userId, type, title, message, relatedId = null, metadata = {}) => {
    try {
      const notification = await supabaseService.create('notifications', {
        userId,
        type,
        title,
        message,
        relatedId,
        metadata,
        isRead: false,
        createdTimestamp: new Date().toISOString()
      });

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  // Get user notifications
  getUserNotifications: async (req, res) => {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, unreadOnly = false } = req.query;

      const options = {
        where: { userId },
        order: { field: 'createdTimestamp', ascending: false },
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      };

      if (unreadOnly === 'true') {
        options.where.isRead = false;
      }

      const notifications = await supabaseService.findAll('notifications', options);

      // Get unread count
      const { count: unreadCount } = await supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('userId', userId)
        .eq('isRead', false);

      res.status(httpStatus.OK).json({
        success: true,
        notifications,
        unreadCount,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: notifications.length
        }
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to fetch notifications'
      });
    }
  },

  // Mark notification as read
  markAsRead: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Verify notification belongs to user
      const notification = await supabaseService.findOne('notifications', id);
      
      if (!notification || notification.userId !== userId) {
        return res.status(httpStatus.NOT_FOUND).json({
          success: false,
          error: 'Notification not found'
        });
      }

      const updatedNotification = await supabaseService.update('notifications', id, {
        isRead: true,
        readAt: new Date().toISOString()
      });

      res.status(httpStatus.OK).json({
        success: true,
        notification: updatedNotification
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to mark notification as read'
      });
    }
  },

  // Mark all notifications as read
  markAllAsRead: async (req, res) => {
    try {
      const userId = req.user.id;

      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ 
          isRead: true, 
          readAt: new Date().toISOString() 
        })
        .eq('userId', userId)
        .eq('isRead', false);

      if (error) throw error;

      res.status(httpStatus.OK).json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to mark all notifications as read'
      });
    }
  },

  // Delete notification
  deleteNotification: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Verify notification belongs to user
      const notification = await supabaseService.findOne('notifications', id);
      
      if (!notification || notification.userId !== userId) {
        return res.status(httpStatus.NOT_FOUND).json({
          success: false,
          error: 'Notification not found'
        });
      }

      await supabaseService.delete('notifications', id);

      res.status(httpStatus.OK).json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to delete notification'
      });
    }
  },

  // Get notification settings
  getNotificationSettings: async (req, res) => {
    try {
      const userId = req.user.id;

      let settings = await supabaseService.findByField('notificationSettings', 'userId', userId, { single: true });

      if (!settings) {
        // Create default settings
        settings = await supabaseService.create('notificationSettings', {
          userId,
          emailNotifications: true,
          pushNotifications: true,
          obituaryApproval: true,
          newCondolences: true,
          newPhotos: true,
          newDedications: true,
          candleLit: true,
          keeperAssigned: true,
          giftReceived: true
        });
      }

      res.status(httpStatus.OK).json({
        success: true,
        settings
      });
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to fetch notification settings'
      });
    }
  },

  // Update notification settings
  updateNotificationSettings: async (req, res) => {
    try {
      const userId = req.user.id;
      const settings = req.body;

      let existingSettings = await supabaseService.findByField('notificationSettings', 'userId', userId, { single: true });

      let updatedSettings;
      if (existingSettings) {
        updatedSettings = await supabaseService.update('notificationSettings', existingSettings.id, settings);
      } else {
        updatedSettings = await supabaseService.create('notificationSettings', {
          userId,
          ...settings
        });
      }

      res.status(httpStatus.OK).json({
        success: true,
        settings: updatedSettings
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to update notification settings'
      });
    }
  },

  // Send notification to multiple users
  sendBulkNotifications: async (userIds, type, title, message, relatedId = null, metadata = {}) => {
    try {
      const notifications = userIds.map(userId => ({
        userId,
        type,
        title,
        message,
        relatedId,
        metadata,
        isRead: false,
        createdTimestamp: new Date().toISOString()
      }));

      const { data, error } = await supabaseAdmin
        .from('notifications')
        .insert(notifications)
        .select();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      throw error;
    }
  }
};

module.exports = notificationController;
