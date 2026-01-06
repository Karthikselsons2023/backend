import { DataTypes } from "sequelize";
import db from "../lib/db.js";

const User = db.define("user", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.STRING,
    unique: true
  },
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
  timestamps: false,

  hooks: {
    afterCreate: async (user) => {
      const paddedId = String(user.id).padStart(4, "0");
      const generatedUserId = `USR${paddedId}`;

      await user.update({ user_id: generatedUserId });
    }
  }
});

export default User;
