const UserModel = require("../models/UserModel");

const searchUser = async (req, res) => {
  try {
    const { search } = req.body;

    const query = search
      ? {
          $or: [
            { name: new RegExp(search, "i") },
            { email: new RegExp(search, "i") },
          ],
        }
      : {};

    const users = await UserModel.find(query).select("-password");

    return res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = searchUser;
