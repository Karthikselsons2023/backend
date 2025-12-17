import ChatMessage from "../model/chatMessage.js";
import { getPresignedUploadUrl } from "../utils/s3Upload.js";

export const generateUploadUrl = async (req, res) => {
  try {
    const { fileName, fileType, folder } = req.body;
    // return res.status(200).json(req.body);
    

    if (!fileName || !fileType) {
      return res.status(400).json({ message: "fileName and fileType required" });
    }

    const data = await getPresignedUploadUrl({
      fileName,
      fileType,
      folder
    });

    res.status(200).json(data);
  } catch (err) {
    console.error("S3 upload url error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateimg = async (req,res)=>{
    try{
        const {fileName,fileType,chat_id,user_id,message_text}=req.body;

        const upload = await ChatMessage.create({
            chat_id: chat_id,
            user_id:user_id,
            file_type:fileType,
            file_url:fileName,
            message_text:message_text
            
        })

        return res.json({
            success:true,
            message:upload
        })

    }catch(err)
    {
        console.error("something Wrong",err);
        res.status(500).json({message: "Internal server error"})
        
    }
}