const express = require("express");

const authenticationMiddleware = require("../middlewares/authentication");
const sorrowBookController = require("../controllers/sorrowBook.controller");
const router = express.Router();

router.post(
  "/:id",
  authenticationMiddleware,
  sorrowBookController.createSorrowBook
);

module.exports = router;
