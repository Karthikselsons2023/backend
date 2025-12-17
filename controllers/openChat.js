import { Op, Sequelize } from "sequelize";
import { Chat, ChatUser,User } from "../model/index.model.js";
// import User from "../model/User.js";
import ChatMessage from "../model/chatMessage.js";
import {getReceiverSocketId,getIo} from "../lib/socket.js";

//SINGLE CHAT
export const openChat = async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);
    const { sender_id, receiver_id, message_text,file_type,file_url } = req.body;

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
      file_type,
      file_url
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

export const sidebarChatList = async (req, res) => {
  try{
    const { user_id } = req.query;
    const currentUserId = req.user.user_id;
   
    //user_id required
    if (!user_id) {
      return res.status(400).json({ message: "user_id required" });
    }
    // validate receiver
    const user = await User.findOne({ where: { user_id: user_id } });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const chats = await ChatUser.findAll({
      where: { user_id },
      attributes: ["chat_id"],
      include: [
        {
          model: Chat,  
          attributes: ["type" ],
          where: { type: "private" },
        },
      ],
    });
   
    const chatIds = chats.map((chat) => chat.chat_id);
 
    const chatList = await Chat.findAll({
  where: { id: chatIds },
  attributes: ["id", "type"],
  include: [
    {
      model: ChatUser,
      where: { user_id: { [Op.ne]: currentUserId } },
      attributes: ["user_id"],
      include: [
        {
          model: User,
          attributes: ["name", "profile", "email", "phone"]
        }
      ]
    },
    {
      model: ChatMessage,
      attributes: ["user_id", "message_text", "created_at"],
      separate: true,
      limit: 1,                       // last message
      order: [["created_at", "DESC"]], // latest first
      include:{
        model: User,
        attributes:["name"]
      }
    }
  ],
  
  order: [
  [Sequelize.literal(`(
    SELECT MAX(created_at)
    FROM sharing_messages
    WHERE sharing_messages.chat_id = chat.id
  )`), "DESC"]
]
});
    return res.status(200).json({
      success: true,
      chatList,
    });
  }catch(err){
    console.error("sidebarChatList error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}
//SINGLE CHAT END 

//GROUP CHAT START
//Create Group Chat
export const createGroupChat = async (req, res) => {
  
  try{
    const { group_name, member_ids,auth_user_id,description,group_img } = req.body;

    // return res.status(200).json(  req.body );

    if (!group_name || !member_ids || !Array.isArray(member_ids) || member_ids.length < 2) {
      return res.status(400).json({
        message: "group_name and at least two member_ids are required",
      });
    }

    const user = await User.findOne({ where: { user_id: auth_user_id } });
    if (!user) {
      return res.status(404).json({ message: "Auth user not found" });
    }

    const memberCheck = await User.findAll({ where: { user_id: member_ids } });
    if (memberCheck.length !== member_ids.length) {
      return res.status(400).json({ message: "One or more member_ids are invalid" });
    }
    
      
    // Create group chat
    const chat = await Chat.create({
      type: "group",
      name: group_name, 
      image_url: group_img || null,
      descritpion: description || null,
      created_by: auth_user_id,
    });

    // Add members to ChatUser
    const chatUsers = member_ids.map((user_id) => ({
      chat_id: chat.id,
      user_id,
      role: "group_member",
    }));
    await ChatUser.bulkCreate(chatUsers);

    //add the auth user as admin
    const authUser = await ChatUser.create({
      chat_id: chat.id,
      user_id: auth_user_id,
      role: "group_admin",
      group_admin: true,
    });

    return res.status(201).json({
      success: true,
      chat_id: chat.id,
      message: "Group chat created successfully",
    });

  }
  catch(err){
    console.error("createGroupChat error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

//Fetch Messages for Group Chat
export const getGroupMessages = async (req, res) => {
  try{
    const {chatId} = req.query;

    if(!chatId){
      return res.status(400).json({ message: "chatId is required" });
    }

    const message_text = await ChatMessage.findAll({
      where: { chat_id: chatId },
      attributes: ["user_id", "message_text", "file_url","file_type","created_at","chat_id"],
      order: [["created_at", "ASC"]],
    });
    
    return res.status(200).json({
      success: true,
      message_text 
    });
  }
  catch(err){
    console.error("getGroupMessages error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

//send message to Group Chat 
export const sendGroupMessage = async (req, res) => {
  try{
    const { chat_id, user_id, message_text,file_url,file_type } = req.body;
   
    if (!chat_id || !user_id || !message_text) {
      return res.status(400).json({
        message: "chat_id, user_id and message_text are required",
      });
    }

    if(chat_id<=0){
      return res.status(400).json({ message: "Invalid chat_id" });
    }

    if(chat_id){
      const chat = await Chat.findByPk(chat_id);
      if(!chat || chat.type!=="group"){
        return res.status(404).json({ message: "Group chat not found" });
      }
    }

    const sendMessage = await ChatMessage.create({
      chat_id,
      user_id,
      message_text,
      file_url: file_url || null,
      file_type: file_type || null
    })

    return res.status(201).json({
      success: true,
      message: sendMessage
    });
    
   

  }
  catch(err){
    console.error("sendGroupMessage error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const groupInfo = async (req, res) => {
  try{
    const {chatId} = req.query;
// return res.status(200).json({ chatId });
    if(!chatId){
      return res.status(400).json({ message: "chatId is required" });
    }

    const groupInfo = await Chat.findOne({
      where: { id: chatId },
      attributes: [
        ["id","chat_id"] , ["name","group_name"], ["image_url","group_image"], ["descritpion","group_description"]],
      include: [
        {
        model: ChatUser,
        attributes: ["user_id", "role","group_admin","group_status"],  
        include: [
          {
            model: User,  
            attributes: ["name", "email", "profile", "phone"]
          }
        ]
    }
  ]
  });

  return res.status(200).json({
    success: true,
    groupInfo
  });
}
  catch(err){
    console.error("groupInfo error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

//Group SideBar
export const groupsidebar = async (req, res) => {
  try{
    const { user_id } = req.query;
     
    // user required
    if (!user_id) {
      return res.status(400).json({ message: "user_id required" });
    }

    // validate User
    const user = await User.findOne({ where: { user_id: user_id } });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const chatUser = await ChatUser.findAll({
      where: { user_id },
      attributes: ["chat_id"], 
  });
   
    const chatIds = chatUser.map((chat) => chat.chat_id);

    const groupChatList = await Chat.findAll({
      where: { 
        type: "group",
      },
      attributes: [ "name", "image_url", "descritpion"],
      include:{
          model:ChatMessage,
          attributes: ["user_id", "message_text", "created_at"],
      separate: true,
      limit: 1,                       // last message
      order: [["created_at", "DESC"]], // latest first
      include:{
        model: User,
        attributes:["name"]
      }
      },
      order: [
  [Sequelize.literal(`(
    SELECT MAX(created_at)
    FROM sharing_messages
    WHERE sharing_messages.chat_id = chat.id
  )`), "DESC"]
]
    });
    return res.status(200).json({
      success: true,
      groupChatList,  
    });
}
  catch(err){
    console.error("groupsidebar error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

//group make admin
export const groupmakeadmin = async(res,req)=>{
  const {auth_id,user_id,chat_id}= req.body
  try {
  if (!auth_id || !user_id || !chat_id) {
    return res.status(400).json({ message: "auth_id, user_id, and chat_id are required" });
  }

  // Check if auth_user is group admin
  const authUser = await ChatUser.findOne({
    where: { chat_id, user_id: auth_id, role: "group_admin" }
  });

  if (!authUser) {
    return res.status(403).json({ message: "Only group admin can make members admin" });
  }

  // Update user role to admin
  await ChatUser.update(
    { role: "group_admin", group_admin: true },
    { where: { chat_id, user_id } }
  );

  return res.status(200).json({
    success: true,
    message: "User promoted to group admin"
  });
} catch (err) {
  console.error("groupmakeadmin error:", err);
  res.status(500).json({ message: "Internal server error" });
}
}

 




