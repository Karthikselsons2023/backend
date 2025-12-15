import { DataTypes } from "sequelize";
import db from "../lib/db.js";

const User = db.define("user", {
    id: {                  // primary key
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {             // unique identifier used in chat tables
        type: DataTypes.STRING,
        unique: true
    },
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    profile: DataTypes.STRING,
    phone: DataTypes.STRING
}, {
    tableName: "users",
    timestamps: false
});

export default User;
