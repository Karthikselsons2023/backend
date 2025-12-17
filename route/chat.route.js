import express from "express";
import { openChat,getMessages,sidebarChatList,createGroupChat,getGroupMessages,sendGroupMessage,groupInfo,groupsidebar } from "../controllers/openChat.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import {generateUploadUrl} from "../controllers/image.js";

const router = express.Router();

// GET /chat/:user_id → open chat with this user
// router.get("/:user_id", protectRoute, openChat);
router.post("/send", openChat);
router.get("/getMessages", protectRoute, getMessages);
router.get("/sidebarChats", protectRoute, sidebarChatList);

//GROUP CHAT ROUTES
router.post("/createGroup", protectRoute, createGroupChat);
router.get("/getGroupMessages", protectRoute, getGroupMessages);
router.post("/sendGroupMessage", protectRoute, sendGroupMessage);
router.get("/groupInfo", groupInfo);
router.get("/groupsidebar", protectRoute, groupsidebar);

//IMAGE 
router.post("/presigned-url",protectRoute,generateUploadUrl);


export default router;
