import { Op, Sequelize } from "sequelize";
import { Chat, ChatUser } from "../model/index.model.js";
import User from "../model/User.js";
import ChatMessage from "../model/chatMessage.js";

export const openChat = async (req, res) => {
  try {
    const currentUser = req.user.user_id;
    const receiver_id = req.body.receiver_id;
    const message = req.body.message;
    const sender_id = req.body.sender_id;

    // return res.status(200).json({ currentUser, receiver_id, message, sender_id });
    
    if (!receiver_id || !message) {
      return res.status(400).json({ message: "receiver_id and message required" });
    }

    // validate other user
    const user = await User.findOne({ where: { user_id: receiver_id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otherUserId = user.user_id;
 
    // 1️⃣ find existing chat_id having both users
    const chatUserRows = await ChatUser.findAll({
      attributes: ["chat_id"],
      where: {
        user_id: { [Op.in]: [sender_id, receiver_id] }
      },
      group: ["chat_id"],
      having: Sequelize.literal("COUNT(DISTINCT user_id) = 2")
    });
    

    let chat;

    // 2️⃣ create chat if not exists
    if (chatUserRows.length === 0) {
      chat = await Chat.create({
        type: "private",
        created_by: sender_id
      });

      await ChatUser.bulkCreate([
        {
          chat_id: chat.id,
          user_id: sender_id,
          role: "member"
        },
        {
          chat_id: chat.id,
          user_id: receiver_id,
          role: "member"
        }
      ]);
    } else {
      // 3️⃣ load existing chat
      chat = await Chat.findOne({where: { id: chatUserRows[0].chat_id }});
        // chat = await Chat.findByPk(chatUserRows[0].chat_id);
    }

     // 3️⃣ Insert message
    const chatMessage = await ChatMessage.create({
      chat_id: chat.id,
      user_id: sender_id,       // sender stored here
      message_text: message
    });

    return res.status(201).json({
      success: true,
      chat_id: chat.id,
      message: chatMessage
    });

  } catch (err) {
    console.error("openChat error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const getMessages = async (req, res) => {
  try{
    const sender_id = req.body.sender_id;
    const receiver_id = req.body.receiver_id;

    if (!receiver_id ) {
      return res.status(400).json({ message: "receiver_id required" });
    }

    const messages = await ChatMessage.findAll({
       where:{
        user_id: { [Op.in]: [sender_id, receiver_id] }
       },
        attributes: ["user_id", "message_text", "created_at"],
       order: [['created_at', 'ASC']]
    });
    return res.status(200).json({
      success: true,
      messages 
    });

  }
  catch(err){
    console.error("getMessages error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
