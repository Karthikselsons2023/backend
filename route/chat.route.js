import express from "express";
import { openChat,getMessages,sidebarChatList,createGroupChat,getGroupMessages,sendGroupMessage,groupInfo,groupsidebar,groupmakeadmin ,groupaddpeople,removeadmin,removegroupmember} from "../controllers/openChat.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import {generateUploadUrl,updateimg} from "../controllers/image.js";

const router = express.Router();

 
router.post("/send", openChat);
router.get("/getMessages", protectRoute, getMessages);
router.get("/sidebarChats", protectRoute, sidebarChatList);

//GROUP CHAT ROUTES
router.post("/createGroup", protectRoute, createGroupChat);
router.get("/getGroupMessages", protectRoute, getGroupMessages);
router.post("/sendGroupMessage", protectRoute, sendGroupMessage);
router.get("/groupInfo", groupInfo);
router.get("/groupsidebar", protectRoute, groupsidebar);
router.post("/groupmakeadmin", protectRoute, groupmakeadmin);
router.post("/groupaddpeople", protectRoute, groupaddpeople);
router.post("/removeadmin", protectRoute, removeadmin);
router.post("/removegroupmember", protectRoute, removegroupmember);

//IMAGE 
router.post("/presigned-url",protectRoute,generateUploadUrl);
router.post("/updateimg",protectRoute,updateimg)


export default router;
