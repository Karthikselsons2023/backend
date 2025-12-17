import Chat from "./chat.model.js";
import ChatUser from "./chatUser.model.js";
import ChatMessage from "./chatMessage.js";
import User from "./User.js";

// Chat ↔ ChatUser
Chat.hasMany(ChatUser, { foreignKey: "chat_id" });
ChatUser.belongsTo(Chat, { foreignKey: "chat_id" });

// User ↔ ChatUser
User.hasMany(ChatUser, { foreignKey: "user_id", sourceKey: "user_id" });
ChatUser.belongsTo(User, { foreignKey: "user_id", targetKey: "user_id" });

Chat.hasMany(ChatMessage, { foreignKey: "chat_id" });
ChatMessage.belongsTo(Chat, { foreignKey: "chat_id" });

 ChatMessage.belongsTo(User, { foreignKey: "user_id", targetKey: "user_id" });
User.hasMany(ChatMessage, { foreignKey: "user_id", sourceKey: "user_id" });

// // User ↔ ChatMessage
// User.hasMany(ChatMessage, { foreignKey: "user_id", sourceKey: "user_id" });
// ChatMessage.belongsTo(User, { foreignKey: "user_id", targetKey: "user_id" });

export { Chat, ChatUser, ChatMessage, User };
