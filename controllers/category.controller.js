const httpStatus = require("http-status-codes").StatusCodes;

const { Category } = require("../models/category.model");

const {Op} = require("sequelize");

const categoryController = {

  createCategory: async (req, res) => {
    try {
      const { name } = req.body;
      const category = await Category.create({ name });
      res.status(httpStatus.OK).json(category);
    } catch (error) {
      console.error(error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  },

  getAllCategories: async (req, res) => {
    try {
      const categories = await Category.findAll();
      res.status(httpStatus.OK).json(categories);
    } catch (error) {
      console.error(error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  },

  deleteCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const category = await Category.findByPk(id);
      if (!category) {
        return res.status(httpStatus.NOT_FOUND).json({ error: "Category not found" });
      }
      await category.destroy();
      res.status(httpStatus.OK).json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  },

  updateCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const category = await Category.findByPk(id);
      if (!category) {
        return res.status(httpStatus.NOT_FOUND).json({ error: "Category not found" });
      }
      category.name = name;
      await category.save();
      res.status(httpStatus.OK).json(category);
    } catch (error) {
      console.error(error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  },

  getCategoryById: async (req, res) => {
    try {
      const { id } = req.params;
      const category = await Category.findByPk(id);
      if (!category) {
        return res.status(httpStatus.NOT_FOUND).json({ error: "Category not found" });
      }
      res.status(httpStatus.OK).json(category);
    } catch (error) {
      console.error(error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  },
}

module.exports = categoryController;
