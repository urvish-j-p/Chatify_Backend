const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const getUserDetailFromToken = require("../helpers/getUserDetailFromToken");
const UserModel = require("../models/UserModel");
const {
  ConversationModel,
  MessageModel,
} = require("../models/ConversationModel");

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
  const token = socket.handshake.auth.token;

  const user = await getUserDetailFromToken(token);

  //create a room
  socket.join(user._id.toString());
  onlineUser.add(user._id.toString());
  io.emit("onlineUser", Array.from(onlineUser));

  socket.on("messagePage", async (userId) => {
    const userDetails = await UserModel.findById(userId).select("-password");

    const payload = {
      _id: userDetails?._id,
      name: userDetails?.name,
      email: userDetails?.email,
      dp: userDetails?.dp,
      online: onlineUser.has(userId),
    };

    socket.emit("messageUser", payload);

    const getConversationMessage = await ConversationModel.findOne({
      $or: [
        {
          sender: user?._id,
          receiver: userId,
        },
        {
          sender: userId,
          receiver: user?._id,
        },
      ],
    })
      .populate("messages")
      .sort({ updatedAt: -1 });

    socket.emit("message", getConversationMessage?.messages);
  });

  socket.on("newMessage", async (data) => {
    let conversation = await ConversationModel.findOne({
      $or: [
        {
          sender: data?.sender,
          receiver: data?.receiver,
        },
        {
          sender: data?.receiver,
          receiver: data?.sender,
        },
      ],
    });

    if (!conversation) {
      const createConversation = await ConversationModel({
        sender: data?.sender,
        receiver: data?.receiver,
      });
      conversation = await createConversation.save();
    }

    const message = await MessageModel({
      text: data?.text,
      imageUrl: data?.imageUrl,
      videoUrl: data?.videoUrl,
      msgByUserId: data?.msgByUserId,
    });

    const saveMessage = await message.save();

    await ConversationModel.updateOne(
      {
        _id: conversation?._id,
      },
      {
        $push: {
          messages: saveMessage?._id,
        },
      }
    );

    const getConversationMessage = await ConversationModel.findOne({
      $or: [
        {
          sender: data?.sender,
          receiver: data?.receiver,
        },
        {
          sender: data?.receiver,
          receiver: data?.sender,
        },
      ],
    })
      .populate("messages")
      .sort({ updatedAt: -1 });

    io.to(data?.sender).emit("message", getConversationMessage?.messages);
    io.to(data?.receiver).emit("message", getConversationMessage?.messages);
  });

  socket.on("disconnect", () => {
    onlineUser.delete(user?._id);
  });
});

module.exports = {
  app,
  server,
};
