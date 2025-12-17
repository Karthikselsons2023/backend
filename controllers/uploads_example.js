import express from "express";

const router = express.Router();


export const uploads_example = async (req,res)=>{
 try {
    const fileUrl = await uploadToS3(req.file, "profiles");

    res.status(200).json({
      message: "Upload successful",
      url: fileUrl
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Upload failed" });
  }

}

// router.post("/upload", upload.single("file"), async (req, res) => {
//   try {
//     const fileUrl = await uploadToS3(req.file, "profiles");

//     res.status(200).json({
//       message: "Upload successful",
//       url: fileUrl
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Upload failed" });
//   }
// });

export default router;
