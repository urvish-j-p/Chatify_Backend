const UserModel = require("../models/UserModel");

const checkEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await UserModel.findOne({ email }).select(
      "-password"
    );

    if (!user) {
      return res.status(400).json({
        message: "User doesn't exist!",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Email verified!",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = checkEmail;
