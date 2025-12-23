import { Op, Sequelize } from "sequelize";
import { Chat, ChatUser,User } from "../model/index.model.js";
import ChatMessage from "../model/chatMessage.js";
import {getReceiverSocketId,getIo} from "../lib/socket.js";
import {getPresignedUrl} from "../lib/aws.js";
import {check_admin,check_group_member,check_user} from "../utils/Group_Helper.js";
//SINGLE CHAT
export const openChat = async (req, res) => {
  try {
   
    var { sender_id, receiver_id, message_text,file_type,file_url } = req.body;

    if (!sender_id || !receiver_id ) {
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
        role:"member",
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
    var chatMessage = await ChatMessage.create({
      chat_id: chat.id,
      user_id: sender_id,
      message_text,
      file_type,
      file_url
    });

    

if (file_url) {
  file_url = await getPresignedUrl(file_url);
}
 
    

    // socket emit
    const senderSocketId = getReceiverSocketId(sender_id);
const receiverSocketId = getReceiverSocketId(receiver_id);

    const io = getIo();
    console.log(senderSocketId, receiverSocketId)

var socketPayload = {
  user_id: sender_id,
  receiver_id,
  message_text,
   file_type,
      file_url,
     
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
         role:"member",
      },
      group: ["chat_id"],
      having: Sequelize.literal("COUNT(DISTINCT user_id) = 2"),
    }).then(rows=>rows.length>0?rows[0].chat_id:null);

    //  return res.status(200).json({ chat_id });

    const messages = await ChatMessage.findAll({
      where: { chat_id },
      attributes: ["user_id", "message_text", "created_at","file_url","file_type"],
      order: [["created_at", "ASC"]],
    });

    const formattedMessages = await Promise.all(
    messages.map(async (msg) => {
    const data = msg.toJSON();

    if (data.file_url ) {
      data.file_url = await getPresignedUrl(data.file_url);
    }
    
    
    return data;
  })
);

    

    return res.status(200).json({
      success: true,
      formattedMessages 
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
    var {chatId} = req.query;

    if(!chatId){
      return res.status(400).json({ message: "chatId is required" });
    }

    var message_text = await ChatMessage.findAll({
      where: { chat_id: chatId },
      attributes: ["user_id", "message_text", "file_url","file_type","created_at","chat_id"],
      order: [["created_at", "ASC"]],
      include:[
        {
           model:User,
           attributes:['name','profile']  
        }
       

      ]
      
    });

    const formattedMessages = await Promise.all(
    message_text.map(async (msg) => {
    const data = msg.toJSON();

    if (data.file_url ) {
      data.file_url = await getPresignedUrl(data.file_url);
    }
    
    
    return data;
  })
);

    
    return res.status(200).json({
      success: true,
      formattedMessages 
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
    var { chat_id, user_id, message_text,file_url,file_type,name,profile } = req.body;
   
    if (!chat_id || !user_id ) {
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

    // Socket Emit to Group Members

    const io = getIo();
 if (file_url) {
  file_url = await getPresignedUrl(file_url);
}
  

const socketPayload = {
  chat_id,              // 👈 REQUIRED
  user_id,
  message_text,
  file_type,
  file_url,
  created_at: sendMessage.created_at,
  user:{
    name,
    profile
  }
};

// emit to ALL users in the group (room)
io.to(String(chat_id)).emit("newGroupMessage", socketPayload);
// io.to(chat_id).emit("newGroupMessage", socketPayload);
    return res.status(201).json({
      success: true,
      formattedMessages: socketPayload,
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
export const groupmakeadmin = async(req,res)=>{

  const {auth_id,user_id,chat_id}= req.body
  try {
  if (!auth_id || !user_id || !chat_id) {
    return res.status(400).json({ message: "auth_id, user_id, and chat_id are required" });
  }

  //check auth is there in the groud and is admin
  const {exists , isAdmin,group } = await check_admin(auth_id,chat_id);
   //check the add user is ther in the group
  const { group_member } = await check_group_member(user_id,chat_id);
   
  if(!group_member){ return res.status(400).json({message:"User not in the Group"})}
  if(!group){ return res.status(400).json({message:"This is Private Chat"})}
  if(!exists){ return res.status(400).json({message:"User not in the Chat"})}
  if(!isAdmin){ return res.status(400).json({message:"only Admin Can perform"})}
  return res.status(200).json({message:"group_admin_checked"});
 
  
}
catch(err)
{
  console.log("error message",err)
  res.status(500).json({message:"Internal Server Error"})
}
}

//add people to group 
export const groupaddpeople = async (req, res) => {
  const { auth_id, user_id, chat_id } = req.body;

  try {
    if (!auth_id || !chat_id || !Array.isArray(user_id)) {
      return res.status(400).json({ message: "Invalid input" });
    }

    // Admin & group check
    const { exists, isAdmin, group } = await check_admin(auth_id, chat_id);
    if (!group) return res.status(400).json({ message: "This is Private Chat" });
    if (!exists) return res.status(400).json({ message: "Auth user not in chat" });
    if (!isAdmin) return res.status(400).json({ message: "Only admin can perform" });

    // Check users exist
    const { users, allExist } = await check_user(user_id);
     
    if (!allExist) {
      return res.status(400).json({
        message: "Some users do not exist",
      });
    }

    // Check already in group
    const { members } = await check_group_member(user_id, chat_id);
    if (members.length > 0) {
      return res.status(400).json({
        message: "Some users already in group",
        alreadyMembers: members.map(m => m.user_id)
      });
    }

    console.log("Users to be added:", user_id);

     
 
    // Add users to group
await Promise.all(user_id.map((uId) => 
  ChatUser.create({
    chat_id,
    user_id: uId,
    role: "group_member",
  })
));

    // ✅ READY TO INSERT
    return res.status(200).json({
      message: "Users added to group",
      users: user_id
    });

  } catch (err) {
    console.log("error message", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

  




