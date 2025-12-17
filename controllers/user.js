import express from "express";
import db from "../lib/db.js";
import User from "../model/User.js";


export const users=async(req,res)=>{
     

     
    const users = await User.findAll({
        where:{ role: 'staff' },
        attributes: { exclude: ['password'] }
    });

    
    res.json(users);
}