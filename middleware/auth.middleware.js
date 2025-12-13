import jwt,{decode} from 'jsonwebtoken';
import User from '../model/User.js';


export const protectRoute  = async(req,res,next)=>{

    try{
        const token =req.cookies.jwt;
         
        if(!token){
            return res.status(401).json({message:"Unauthorized! Please login"});
        }

        const decoded =  jwt.verify(token,process.env.JWT_SECRET_KEY);
        if(!decoded){
            return res.status(401).json({message:"Unauthorized! Invalid token"});
        }

        const user= await User.findOne({
            where:{user_id:decoded.userId},
            attributes:{exclude:['password']}    
        })
        if(!user){
            return res.status(401).json({message:"Unauthorized! User not found"});
        }

        req.user=user;
        next();

    }
    catch(err){
        console.error("Error in the message",err.message);
        res.status(500).json({message:"Server Error"});
    }
}