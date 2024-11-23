const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const getUserDetailFromToken = require("../helpers/getUserDetailFromToken");
const UserModel = require("../models/UserModel");
const {
  ConversationModel,
  MessageModel,
} = require("../models/ConversationModel");
const getConversation = require("../helpers/getConversation");

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  pingInterval: 10000, // Send a ping every 10 seconds
  pingTimeout: 5000, // Disconnect if no response after 5 seconds
  cors: {
    origin: [process.env.FRONTEND_URL, "http://localhost:5173", "https://chatify-by-urvish.vercel.app"],
    credentials: true,
  },
});

const onlineUser = new Set();

io.on("connection", async (socket) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    console.error("No token provided in handshake");
    socket.disconnect(true); 
    return;
  }

  let user;
  try {
    user = await getUserDetailFromToken(token); 
    if (!user) {
      console.error("Invalid token or user not found");
      socket.disconnect(true); 
      return;
    }

    const userId = user._id.toString();
    socket.join(userId);

    onlineUser.add(userId);
    io.emit("onlineUser", Array.from(onlineUser));

    console.log(`User ${userId} connected`);
  } catch (error) {
    console.error("Error validating token:", error.message);
    socket.disconnect(true); 
    return;
  }

  // //create a room
  // socket.join(user?._id?.toString());
  // onlineUser.add(user?._id?.toString());
  // io.emit("onlineUser", Array.from(onlineUser));

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

    socket.emit("message", getConversationMessage?.messages || []);
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

    io.to(data?.sender).emit("message", getConversationMessage?.messages || []);
    io.to(data?.receiver).emit(
      "message",
      getConversationMessage?.messages || []
    );
  });

  //sidebar
  socket.on("sidebar", async (currentUserId) => {
    const conversation = await getConversation(currentUserId);

    socket.emit("conversation", conversation);
  });

  socket.on("seen", async (msgByUserId) => {
    let conversation = await ConversationModel.findOne({
      $or: [
        {
          sender: user?._id,
          receiver: msgByUserId,
        },
        {
          sender: msgByUserId,
          receiver: user?._id,
        },
      ],
    });

    const convMsgIds = conversation?.messages || [];

    await MessageModel.updateMany(
      { _id: { $in: convMsgIds }, msgByUserId: msgByUserId },
      {
        $set: { seen: true },
      }
    );

    const senderConv = await getConversation(user?._id?.toString());
    const receiverConv = await getConversation(msgByUserId);

    io.to(user?._id?.toString()).emit("conversation", senderConv);
    io.to(msgByUserId).emit("conversation", receiverConv);
  });

  //disconnect
  socket.on("disconnect", () => {
    onlineUser.delete(user?._id?.toString());
  });
});

module.exports = {
  app,
  server,
};
