const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const getUserDetailFromToken = require("../helpers/getUserDetailFromToken");
const UserModel = require("../models/UserModel");

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
});

const onlineUser = new Set();

io.on("connection", async (socket) => {
  console.log("User connected having id: ", socket.id);

  const token = socket.handshake.auth.token;

  const user = await getUserDetailFromToken(token);

  console.log("User is: ", user);

  //create a room
  socket.join(user._id);
  onlineUser.add(user._id.toString());
  io.emit("onlineUser", Array.from(onlineUser));

  socket.on("messagePage", async (userId) => {
    console.log("userId is:", userId);

    const userDetails = await UserModel.findById(userId).select("-password");

    const payload = {
      _id: userDetails?._id,
      name: userDetails?.name,
      email: userDetails?.email,
      dp: userDetails?.dp,
      online: onlineUser.has(userId),
    };

    socket.emit("messageUser", payload);
  });

  socket.on("disconnect", () => {
    onlineUser.delete(user?._id);
    console.log("User disconnected having id: ", socket.id);
  });
});

module.exports = {
  app,
  server,
};
