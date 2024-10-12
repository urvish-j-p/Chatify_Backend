const getUserDetailFromToken = require("../helpers/getUserDetailFromToken");

const userDetails = async (req, res) => {
  try {
    const token = req.cookies.token || "";

    const user = await getUserDetailFromToken(token);
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = userDetails;
