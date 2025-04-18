const httpStatus = require("http-status-codes").StatusCodes;

const { User, validateUser } = require("../models/user.model");

const userController = {
  register: async (req, res) => {
    const { name, email, password, role, company, region, city } = req.body;

    const { error } = validateUser(req.body);

    if (error) {
      console.warn(`Invalid data format: ${error}`);

      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: `Invalid data format: ${error}` });
    }

    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      console.warn("User already registered");

      return res
        .status(httpStatus.CONFLICT)
        .json({ error: "User already registered" });
    }

    const newUser = await User.create({
      name,
      email,
      password,
      role,
      company,
      region,
      city,
    });

    res.status(httpStatus.CREATED).json({
      message: "User registered successfully!",
      user: newUser.toSafeObject(),
    });
  },

  getMyUser: async (req, res) => {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      console.warn("User not found");

      return res.status(httpStatus.NOT_FOUND).json({ error: "User not found" });
    }

    res.status(httpStatus.OK).json(user.toSafeObject());
  },

  updateMyUser: async (req, res) => {
    const { email, company, region, city } = req.body;

    const user = await User.findByPk(req.user.id);
    console.log(req.body);
    if (!user) {
      console.warn("User not found");

      return res.status(httpStatus.NOT_FOUND).json({ error: "User not found" });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });

      if (existingUser) {
        console.warn("Email is already in use");
        return res
          .status(httpStatus.CONFLICT)
          .json({ error: "Email is already in use" });
      }
    }

    if (email) user.email = email;
    if (company) user.company = company;
    if (region) user.region = region;
    if (city) user.city = city;

    await user.save();

    res.status(httpStatus.OK).json({
      message: "User updated successfully",
      updatedUser: user.toSafeObject(),
    });
  },

  deleteMyUser: async (req, res) => {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      console.warn("User not found");

      return res.status(httpStatus.NOT_FOUND).json({ error: "User not found" });
    }

    await user.destroy();

    res.status(httpStatus.OK).json({
      message: "User deleted successfully",
    });
  },
};

module.exports = userController;
