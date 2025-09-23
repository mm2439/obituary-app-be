const httpStatus = require("http-status-codes").StatusCodes;

const { Op } = require("sequelize");

const { User } = require("../models/user.model");
const {
  SorrowBook,
  validateSorrowBook,
} = require("../models/sorrow_book.model");
const memoryLogsController = require("./memoryLogs.controller");
const sorrowBookController = {
  createSorrowBook: async (req, res) => {
    try {
      const { name, relation } = req.body;
      const userId = req.user.id;
      const obituaryId = req.params.id;
      console.log(req.body);
      // Validate input
      const { error } = validateSorrowBook(req.body);
      if (error) {
        console.warn(`Invalid data format: ${error}`);
        return res
          .status(httpStatus.BAD_REQUEST)
          .json({ error: `Napačni format: ${error}` });
      }

      // Check if user already added a name
      const existingEntry = await SorrowBook.findOne({
        where: { userId, obituaryId },
      });
      if (existingEntry) {
        return res.status(httpStatus.CONFLICT).json({
          error: "V to osmrtnico si že dodal svoje ime",
        });
      }

      // Create a new sorrow book entry
      const sorrowBook = await SorrowBook.create({
        name,
        relation,
        userId,
        obituaryId,
      });
      if (sorrowBook) {
        try {
          await memoryLogsController.createLog(
            "sorrowbook",
            obituaryId,
            userId,
            sorrowBook.id,
            "approved",
            sorrowBook.name,
            "Žalna knjiga"
          );
        } catch (logError) {
          console.error("Error creating memory log:", logError);
        }
      }
      res.status(httpStatus.CREATED).json(sorrowBook);
    } catch (error) {
      console.error("Error creating sorrow book:", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Prišlo je do napake" });
    }
  },
};

module.exports = sorrowBookController;
