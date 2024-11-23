const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/connectDB");
const router = require("./routes/index");
const cookieParser = require("cookie-parser");
const { app, server } = require("./socket/index");

app.use(
  cors({
    origin: [process.env.FRONTEND_URL, "http://localhost:5173", "https://chatify-by-urvish.vercel.app"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.send("This is a root route of Chatify!");
});

app.use("/api", router);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
});
