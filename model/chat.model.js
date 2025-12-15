// chat.model.js
import { DataTypes } from "sequelize";
import db from "../lib/db.js";

const Chat = db.define("chat", {
    id: {   // match the DB column
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    type: DataTypes.STRING,
    name: DataTypes.STRING,
    created_by: DataTypes.STRING
}, {
    tableName: "sharing_chats",
    timestamps: true,
    createdAt: 'created_at',
  updatedAt: 'updated_at'
});


export default Chat;
