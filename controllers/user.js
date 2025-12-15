import express from "express";
import db from "../lib/db.js";
import User from "../model/User.js";


export const users=async(req,res)=>{
    const baseurl = "http://selsons.com/";

     
    const users = await User.findAll({
        where:{ role: 'staff' },
        attributes: { exclude: ['password'] }
    });

    const mapUser = users.map(user=>({
        ...user.toJSON(),
        profile: user.profile ? baseurl + user.profile : null
    

    }));
    res.json(mapUser);
}