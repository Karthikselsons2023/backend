import { DataTypes } from "sequelize";
import db from "../lib/db.js";

const User = db.define("user", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.STRING, unique: true },
  name: DataTypes.STRING,
  email: DataTypes.STRING,
  password: DataTypes.STRING,
  profile: {
    type: DataTypes.STRING,
    get() {
      const value = this.getDataValue("profile");
      const domain = process.env.IMAGE_DOMAIN || "http://localhost:3000/";
      return value ? domain + value : null;
    }
  },
  phone: DataTypes.STRING
}, {
  tableName: "users",
  timestamps: false
});

export default User;
