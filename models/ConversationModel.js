const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    messages: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Message",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const messageSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      default: "",
    },
    imageUrl: {
      type: String,
      default: "",
    },
    videoUrl: {
      type: String,
      default: "",
    },
    seen: {
      type: Boolean,
      default: false,
    },
    msgByUserId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const ConversationModel = mongoose.model("Conversation", conversationSchema);
const MessageModel = mongoose.model("Message", messageSchema);

module.exports = { ConversationModel, MessageModel };
