import { Op, Sequelize } from "sequelize";
import { Chat, ChatUser } from "../model/index.model.js";
import User from "../model/User.js";
import ChatMessage from "../model/chatMessage.js";
import {getReceiverSocketId,getIo} from "../lib/socket.js";
export const openChat = async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);
    const { sender_id, receiver_id, message_text } = req.body;

    if (!sender_id || !receiver_id || !message_text) {
      return res.status(400).json({
        message: "sender_id, receiver_id, message_text required",
      });
    }

    // validate receiver
    const user = await User.findOne({ where: { user_id: receiver_id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // find existing chat
    const chatUserRows = await ChatUser.findAll({
      attributes: ["chat_id"],
      where: {
        user_id: { [Op.in]: [sender_id, receiver_id] },
      },
      group: ["chat_id"],
      having: Sequelize.literal("COUNT(DISTINCT user_id) = 2"),
    });

    let chat;

    if (chatUserRows.length === 0) {
      chat = await Chat.create({
        type: "private",
        created_by: sender_id,
      });

      await ChatUser.bulkCreate([
        { chat_id: chat.id, user_id: sender_id, role: "member" },
        { chat_id: chat.id, user_id: receiver_id, role: "member" },
      ]);
    } else {
      chat = await Chat.findByPk(chatUserRows[0].chat_id);
    }

    // save message
    const chatMessage = await ChatMessage.create({
      chat_id: chat.id,
      user_id: sender_id,
      message_text,
    });

    // socket emit
    const senderSocketId = getReceiverSocketId(sender_id);
const receiverSocketId = getReceiverSocketId(receiver_id);

    const io = getIo();
    console.log(senderSocketId, receiverSocketId)

const socketPayload = {
  user_id: sender_id,
  receiver_id,
  message_text,
  created_at: chatMessage.created_at,
};

if (receiverSocketId) {
  io.to(receiverSocketId).emit("newMessage", socketPayload);
}

if (senderSocketId) {
  io.to(senderSocketId).emit("newMessage", socketPayload);
}


    return res.status(201).json({
      success: true,
      message: chatMessage,
    });
  } catch (err) {
    console.error("openChat error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};



export const getMessages = async (req, res) => {
  try{
    
const { sender_id, receiver_id } = req.query;

 
    if (!receiver_id ) {
      return res.status(400).json({ message: "receiver_id required" });
    }
    const user = await User.findOne({ where: { user_id: receiver_id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const chat_id=await ChatUser.findAll({
      attributes: ["chat_id"],
      where: {
        user_id: { [Op.in]: [sender_id, receiver_id] },
      },
      group: ["chat_id"],
      having: Sequelize.literal("COUNT(DISTINCT user_id) = 2"),
    }).then(rows=>rows.length>0?rows[0].chat_id:null);

    // return res.status(200).json({ chat_id });

    const messages = await ChatMessage.findAll({
      where: { chat_id },
      attributes: ["user_id", "message_text", "created_at"],
      order: [["created_at", "ASC"]],
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



