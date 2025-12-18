import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, Aws_Bucket } from "../lib/aws.js"

export const getPresignedUploadUrl = async ({
  fileName,
  fileType,
  folder 
}) => {
  const key = `${folder}/${Date.now()}-${fileName}`;
 
  const command = new PutObjectCommand({
    Bucket: Aws_Bucket,
    Key: key,
    ContentType: fileType
  });

  const uploadUrl = await getSignedUrl(s3, command, {
    expiresIn: 60 // seconds
  });

  return {
    uploadUrl,
    // fileUrl: `${key}`
    fileUrl: `https://${Aws_Bucket}.s3.amazonaws.com/${key}`
  };
};
