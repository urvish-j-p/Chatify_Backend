const UserModel = require("../models/UserModel");
const bcrypt = require("bcryptjs");

const registerUser = async (req, res) => {
  try {
    const { name, email, password, dp } = req.body;

    const isEmailExists = await UserModel.findOne({ email });

    if (isEmailExists) {
      return res.status(400).json({ message: "User already exist!" });
    }

    const hashPassword = await bcrypt.hash(password, 10); //10 is salt

    const newUser = new UserModel({
      name,
      email,
      password: hashPassword,
      dp,
    });

    const createdUser = await newUser.save();

    return res.status(200).json({
      success: true,
      message: "User created successfully!",
      data: createdUser,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = registerUser;
