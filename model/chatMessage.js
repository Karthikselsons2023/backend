import {DataTypes,Sequelize} from "sequelize";
import db from "../lib/db.js";
import Chat from "./chat.model.js";
import User from "./User.js";

const ChatMessage = db.define("ChatMessage",{
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    chat_id: DataTypes.INTEGER,
    user_id: DataTypes.STRING,
    message_text: DataTypes.STRING,
    file_url: DataTypes.STRING,
    file_type:DataTypes.STRING,
    
},
{
    tableName: "sharing_messages",
    timestamps: true,
     createdAt: 'created_at',
  updatedAt: 'updated_at'
});
// Associations
ChatMessage.belongsTo(Chat, { foreignKey: "chat_id" });
ChatMessage.belongsTo(User, { foreignKey: "user_id" });

export default ChatMessage;