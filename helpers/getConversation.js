const { ConversationModel } = require("../models/ConversationModel");

const getConversation = async (currentUserId) => {
  if (currentUserId) {
    const currentUserConversation = await ConversationModel.find({
      $or: [
        {
          sender: currentUserId,
        },
        {
          receiver: currentUserId,
        },
      ],
    })
      .sort({ updatedAt: -1 })
      .populate("messages sender receiver");

    const conversation = currentUserConversation.map((conv) => {
      const unseenMsgCount = conv?.messages?.reduce((prev, curr) => {
        const msgByUserId = curr?.msgByUserId?.toString();
        if (msgByUserId !== currentUserId) {
          return prev + (curr?.seen ? 0 : 1);
        } else {
          return prev;
        }
      }, 0);
      return {
        id: conv?._id,
        sender: conv?.sender,
        receiver: conv?.receiver,
        unseenMsg: unseenMsgCount,
        lastMsg: conv?.messages[conv?.messages?.length - 1],
      };
    });

    return conversation;
  } else {
    return [];
  }
};

module.exports = getConversation;
