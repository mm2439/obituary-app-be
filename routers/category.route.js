const express = require("express");
const authenticationMiddleware = require("../middlewares/authentication");
const authorization = require("../middlewares/authorization");
const categoryController = require("../controllers/category.controller");
const router = express.Router();

router.post(
  "/",
  authenticationMiddleware,
  authorization("SUPERADMIN"),
  categoryController.createCategory
);
router.get("/", categoryController.getAllCategories);
router.delete(
  "/:id",
  authenticationMiddleware,
  authorization("SUPERADMIN"),
  categoryController.deleteCategory
);
router.patch(
  "/:id",
  authenticationMiddleware,
  authorization("SUPERADMIN"),
  categoryController.updateCategory
);
router.get("/:id", categoryController.getCategoryById);

module.exports = router;
