const UserModel = require("../models/UserModel");

const searchUser = async (req, res) => {
  try {
    const { search } = req.body;

    if (!search) {
      return res
        .status(400)
        .json({ success: false, message: "Search term is required." });
    }

    const query = new RegExp(search, "i");

    const user = await UserModel.find({
      $or: [{ name: query }, { email: query }],
    }).select("-password")

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = searchUser;
