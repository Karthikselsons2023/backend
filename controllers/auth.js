import bcrypt from "bcryptjs";
import { generateToken } from "../lib/util.js";
import User from "../model/User.js";
import db from "../lib/db.js";

 

export const login = async (req, res) => {
  

  try {

     const body = req.body || {}; // ⚡ fallback to empty object
    const email = body.email;
    const password = body.password;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }
    //console.log("📌 Login route hit", req.body); // ← to test route
    

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: "Invalid User" });
    }

    // Laravel bcrypt ($2y$ → $2a$)
    const laravelHash = user.password.replace("$2y$", "$2a$");

    const isPasswordCorrect = await bcrypt.compare(password, laravelHash);

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid Password" });
    }
    // if(user.profile){
    //     user.profile = "http://selsons.com/" + user.profile;
    // }

    generateToken(user.user_id, res);
    // SUCCESS RESPONSE
    return res.status(200).json({
       user_id: user.user_id, 
      fullName: user.name,
      email: user.email,
      profilePic: user.profile,
      
    });

  } catch (error) {
    console.log("❌ Error in login controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const checkAuth = async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server error" });
  }
};

//logout any existing session
   export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", {
      maxAge: 0,
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      secure: process.env.NODE_ENV === "production"
    });

    return res.status(200).json({ message: "Logged out successfully" });

  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
 export const register = async (req,res)=>{
  try{
    const { name, email, phone, profile } = req.body;

    const user = await User.create({
      name,
      email,
      phone,
      profile
    });

    return res.status(201).json({
      success: true,
      user
    });


  }
  catch(error){
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server error" });
    console.log("Generated User ID:", createdUser.user_id);
  }
 }