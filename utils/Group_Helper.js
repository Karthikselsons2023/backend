import express from "express";
import {Chat,ChatUser,ChatMessage} from "../model/index.model.js"
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
console.log("trueee");
return{
    exists:true,
    group:true,
    isAdmin:user_check.group_admin == 1
}


}

export const check_group_member = async(user_id,chat_id)=>{
     
    const member_check = await ChatUser.findOne({
        where:{user_id,chat_id}
    });
     
    if(!member_check)
    {
        return {group_member:false};
    }
    return { group_member:true};
}

export const check_user = async(user_id)=>{
    console.log("check user",user_id);
    const user_check = await ChatUser.findOne({
        where:{user_id}
    });

   // console.log(user_check);

    if(!user_check)
    {
        
        return {user_exists:true};
    }
     
    return { user_exists:false};
}