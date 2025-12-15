// chatUser.model.js
import { DataTypes } from "sequelize";
import db from "../lib/db.js";

const ChatUser = db.define("chat_user", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  chat_id: DataTypes.INTEGER,
  user_id: DataTypes.STRING,
  role: DataTypes.STRING
}, { 
    tableName: "sharing_chat_user", 
    timestamps: true,
 createdAt: 'created_at',
  updatedAt: 'updated_at' });

export default ChatUser;
