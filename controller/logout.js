const logout = async (req, res) => {
  try {
    const cookieOption = {
      httpOnly: true,
      secure: true,
    };

    return res
      .cookie("token", "", cookieOption)
      .status(200)
      .json({ success: true, message: "Session expired!" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = logout;
