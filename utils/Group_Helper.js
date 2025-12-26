import express from "express";
import {Chat,ChatUser,ChatMessage,User} from "../model/index.model.js"
// import { use } from "react";
// import Chat from "../model/chat.model.js"
// import ChatUser from "../model/chatUser.model.js";

//Check amdin 
export const check_admin = async(user_id,chat_id)=>{
    

const check_group = await Chat.findAll({
    where:{ id:chat_id,type:"group"}
    
});
if(!check_group)
{
    return {group:false,exists:false,isAdmin:false}
}

const user_check = await ChatUser.findOne({
    where:{user_id,chat_id}

})
    
if(!user_check)
{
 
    return { 
        group:true,
        exists:false,
        isAdmin:false
    }
}
 
return{
    exists:true,
    group:true,
    isAdmin:user_check.group_admin == 1
}


}

export const check_group_member = async(user_ids,chat_id)=>{
     
   const members = await ChatUser.findAll({
    where: {
      chat_id,
      user_id: user_ids,
      group_status:0  
    }
  });

  return {
    members,           // existing members
    alreadyInGroup: members.length > 0
  };
};

export const check_user = async(user_ids)=>{
     
    
    const users = await User.findAll({
    where: {
      user_id: user_ids   // Sequelize auto uses IN (...)
    }
  });

  return {
    users,
    allExist: users.length === user_ids.length
  };
};

export const group_member_check = async(user_id,chat_id)=>{
    console.log("Checking group member:", user_id, chat_id);

    const member = await ChatUser.findOne({
        where: { user_id, chat_id }
    });

    const alreadyAdmin = member ? member.group_admin == 1 : false;

    console.log("Member found:", member);
    console.log("Is already admin:", alreadyAdmin);

    if (!member) {
        return { group_member: false, alreadyAdmin: false };
    }
    return { group_member: true, alreadyAdmin };
}