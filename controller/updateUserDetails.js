const getUserDetailFromToken = require("../helpers/getUserDetailFromToken");
const UserModel = require("../models/UserModel");

const updateUserDetails = async (req, res) => {
  try {
    const token = req.cookies.token || "";

    const user = await getUserDetailFromToken(token);

    const { name, dp } = req.body;

    await UserModel.updateOne(
      { _id: user._id },
      {
        name,
        dp,
      }
    );

    const updatedUser = await UserModel.findById(user._id).select("-password");

    return res.status(200).json({
      success: true,
      message: "User updated successfully!",
      data: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = updateUserDetails;
