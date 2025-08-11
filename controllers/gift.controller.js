const { supabaseAdmin } = require('../config/supabase');
const supabaseService = require('../services/supabaseService');
const httpStatus = require("http-status-codes").StatusCodes;
const notificationController = require('./notification.controller');
const activityLogController = require('./activityLog.controller');

const giftController = {
  // Send digital gift
  sendDigitalGift: async (req, res) => {
    try {
      const { 
        recipientEmail, 
        obituaryId, 
        giftType, 
        giftData, 
        message, 
        senderName 
      } = req.body;
      
      const senderId = req.user.id;

      // Validate recipient exists
      const recipient = await supabaseService.findByField('profiles', 'email', recipientEmail, { single: true });
      
      if (!recipient) {
        return res.status(httpStatus.NOT_FOUND).json({
          success: false,
          error: 'Recipient not found'
        });
      }

      // Validate obituary exists
      const obituary = await supabaseService.findOne('obituaries', obituaryId);
      
      if (!obituary) {
        return res.status(httpStatus.NOT_FOUND).json({
          success: false,
          error: 'Obituary not found'
        });
      }

      // Create gift record
      const gift = await supabaseService.create('gifts', {
        senderId,
        recipientId: recipient.id,
        recipientEmail,
        obituaryId,
        giftType,
        giftData,
        message,
        senderName,
        status: 'sent',
        sentAt: new Date().toISOString()
      });

      // Create notification for recipient
      await notificationController.createNotification(
        recipient.id,
        'gift_received',
        'You received a gift',
        `${senderName} sent you a ${giftType} for ${obituary.name} ${obituary.sirName}`,
        gift.id,
        { giftType, obituaryName: `${obituary.name} ${obituary.sirName}` }
      );

      // Log activity
      await activityLogController.createLog(
        senderId,
        'send_gift',
        'gift',
        gift.id,
        { giftType, recipientEmail, obituaryId }
      );

      res.status(httpStatus.CREATED).json({
        success: true,
        gift,
        message: 'Gift sent successfully'
      });
    } catch (error) {
      console.error('Error sending digital gift:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to send gift'
      });
    }
  },

  // Get received gifts
  getReceivedGifts: async (req, res) => {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, status } = req.query;

      let whereClause = { recipientId: userId };
      if (status) {
        whereClause.status = status;
      }

      const gifts = await supabaseService.findAll('gifts', {
        where: whereClause,
        order: { field: 'sentAt', ascending: false },
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      });

      // Get additional details for each gift
      const enrichedGifts = await Promise.all(gifts.map(async (gift) => {
        const sender = await supabaseService.findOne('profiles', gift.senderId);
        const obituary = await supabaseService.findOne('obituaries', gift.obituaryId);
        
        return {
          ...gift,
          sender: sender ? { name: sender.name, email: sender.email } : null,
          obituary: obituary ? { name: obituary.name, sirName: obituary.sirName, slugKey: obituary.slugKey } : null
        };
      }));

      res.status(httpStatus.OK).json({
        success: true,
        gifts: enrichedGifts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: gifts.length
        }
      });
    } catch (error) {
      console.error('Error fetching received gifts:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to fetch received gifts'
      });
    }
  },

  // Get sent gifts
  getSentGifts: async (req, res) => {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, status } = req.query;

      let whereClause = { senderId: userId };
      if (status) {
        whereClause.status = status;
      }

      const gifts = await supabaseService.findAll('gifts', {
        where: whereClause,
        order: { field: 'sentAt', ascending: false },
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      });

      // Get additional details for each gift
      const enrichedGifts = await Promise.all(gifts.map(async (gift) => {
        const recipient = await supabaseService.findOne('profiles', gift.recipientId);
        const obituary = await supabaseService.findOne('obituaries', gift.obituaryId);
        
        return {
          ...gift,
          recipient: recipient ? { name: recipient.name, email: recipient.email } : null,
          obituary: obituary ? { name: obituary.name, sirName: obituary.sirName, slugKey: obituary.slugKey } : null
        };
      }));

      res.status(httpStatus.OK).json({
        success: true,
        gifts: enrichedGifts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: gifts.length
        }
      });
    } catch (error) {
      console.error('Error fetching sent gifts:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to fetch sent gifts'
      });
    }
  },

  // Mark gift as viewed
  markGiftAsViewed: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Verify gift belongs to user
      const gift = await supabaseService.findOne('gifts', id);
      
      if (!gift || gift.recipientId !== userId) {
        return res.status(httpStatus.NOT_FOUND).json({
          success: false,
          error: 'Gift not found'
        });
      }

      const updatedGift = await supabaseService.update('gifts', id, {
        status: 'viewed',
        viewedAt: new Date().toISOString()
      });

      // Log activity
      await activityLogController.createLog(
        userId,
        'view_gift',
        'gift',
        id,
        { giftType: gift.giftType }
      );

      res.status(httpStatus.OK).json({
        success: true,
        gift: updatedGift
      });
    } catch (error) {
      console.error('Error marking gift as viewed:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to mark gift as viewed'
      });
    }
  },

  // Get gift statistics for admin
  getGiftStatistics: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      let query = supabaseAdmin
        .from('gifts')
        .select('giftType, status, sentAt');

      if (startDate) {
        query = query.gte('sentAt', startDate);
      }

      if (endDate) {
        query = query.lte('sentAt', endDate);
      }

      const { data: gifts, error } = await query;

      if (error) throw error;

      const stats = {
        totalGifts: gifts.length,
        giftTypeBreakdown: {},
        statusBreakdown: {},
        dailyGifts: {}
      };

      gifts.forEach(gift => {
        // Gift type breakdown
        stats.giftTypeBreakdown[gift.giftType] = (stats.giftTypeBreakdown[gift.giftType] || 0) + 1;

        // Status breakdown
        stats.statusBreakdown[gift.status] = (stats.statusBreakdown[gift.status] || 0) + 1;

        // Daily gifts
        const date = new Date(gift.sentAt).toDateString();
        stats.dailyGifts[date] = (stats.dailyGifts[date] || 0) + 1;
      });

      res.status(httpStatus.OK).json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Error fetching gift statistics:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to fetch gift statistics'
      });
    }
  },

  // Get available gift types
  getGiftTypes: async (req, res) => {
    try {
      const giftTypes = await supabaseService.findAll('giftTypes', {
        where: { isActive: true },
        order: { field: 'name', ascending: true }
      });

      res.status(httpStatus.OK).json({
        success: true,
        giftTypes
      });
    } catch (error) {
      console.error('Error fetching gift types:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to fetch gift types'
      });
    }
  },

  // Admin: Create gift type
  createGiftType: async (req, res) => {
    try {
      const { name, description, price, category, digitalData, isActive = true } = req.body;

      const giftType = await supabaseService.create('giftTypes', {
        name,
        description,
        price,
        category,
        digitalData,
        isActive
      });

      res.status(httpStatus.CREATED).json({
        success: true,
        giftType
      });
    } catch (error) {
      console.error('Error creating gift type:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to create gift type'
      });
    }
  },

  // Admin: Update gift type
  updateGiftType: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const giftType = await supabaseService.update('giftTypes', id, updateData);

      res.status(httpStatus.OK).json({
        success: true,
        giftType
      });
    } catch (error) {
      console.error('Error updating gift type:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to update gift type'
      });
    }
  }
};

module.exports = giftController;
