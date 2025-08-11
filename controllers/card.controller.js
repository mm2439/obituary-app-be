const { Card } = require("../models/card.model");
const { User } = require("../models/user.model");
const memoryLogsController = require("./memoryLogs.controller");
const pdfService = require("../services/pdfService");
const emailService = require("../services/emailService");
const supabaseService = require("../services/supabaseService");
const notificationController = require("./notification.controller");

const httpStatus = require("http-status-codes").StatusCodes;

const cardController = {
  createCard: async (req, res) => {
    try {
      const { email, obituaryId, cardId } = req.body;
      const UserExists = await User.findOne({ where: { email } });
      const cardExists = await Card.findOne({
        where: { email, obituaryId, cardId },
      });
      if (cardExists) {
        return res
          .status(httpStatus.CONFLICT)
          .json({ message: "User Already has this card" });
      }
      if (!UserExists) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ message: "No Such User Found" });
      }

      const card = await Card.create({
        email,
        userId: UserExists.id,
        obituaryId,
        cardId,
      });

      await memoryLogsController.createLog(
        "card",
        obituaryId,
        UserExists.id,
        card.id,
        "approved",
        UserExists.name,
        `MOBI Pogreb ${cardId}`
      );

      res.status(httpStatus.CREATED).json(card);
    } catch (error) {
      console.error("Error generating card:", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Something went wrong" });
    }
  },

  // Generate and send digital card as PDF
  generateDigitalCard: async (req, res) => {
    try {
      const {
        obituaryId,
        recipientEmail,
        message,
        cardType = 'memorial',
        senderName
      } = req.body;

      const senderId = req.user.id;

      // Get obituary details
      const obituary = await supabaseService.findOne('obituaries', obituaryId);
      if (!obituary) {
        return res.status(httpStatus.NOT_FOUND).json({
          success: false,
          error: 'Obituary not found'
        });
      }

      // Get recipient details
      const recipient = await supabaseService.findByField('profiles', 'email', recipientEmail, { single: true });
      if (!recipient) {
        return res.status(httpStatus.NOT_FOUND).json({
          success: false,
          error: 'Recipient not found'
        });
      }

      // Prepare card data
      const cardData = {
        obituaryName: obituary.name,
        obituarySirName: obituary.sirName,
        senderName: senderName || req.user.name,
        recipientName: recipient.name,
        message,
        cardType,
        obituaryImage: obituary.image
      };

      // Generate PDF
      const pdfResult = await pdfService.generateAndUploadCard(cardData, senderId);

      if (!pdfResult.success) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: 'Failed to generate PDF card'
        });
      }

      // Create card record
      const card = await Card.create({
        email: recipientEmail,
        userId: recipient.id,
        obituaryId,
        cardId: Date.now(),
        pdfUrl: pdfResult.pdfUrl,
        message,
        senderName,
        senderId
      });

      // Send notification to recipient
      await notificationController.createNotification(
        recipient.id,
        'digital_card_received',
        'You received a digital memorial card',
        `${senderName} sent you a digital memorial card for ${obituary.name} ${obituary.sirName}`,
        card.id,
        { cardType, obituaryName: `${obituary.name} ${obituary.sirName}` }
      );

      res.status(httpStatus.CREATED).json({
        success: true,
        message: "Digital card created and sent successfully",
        card: {
          ...card.toJSON(),
          pdfUrl: pdfResult.pdfUrl
        }
      });
    } catch (error) {
      console.error("Error generating digital card:", error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: "Failed to generate digital card"
      });
    }
  }
};

module.exports = cardController;
