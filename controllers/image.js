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
