import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";


export const Aws_Bucket = process.env.AWS_BUCKET_NAME;

export const s3 = new S3Client({
    region:process.env.AWS_DEFAULT_REGION,
    credentials:{
        accessKeyId:process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY
    }
})

//HELPER FUNTION
export const getPresignedUrl = async (key) => {
  const command = new GetObjectCommand({
    Bucket: process.env.Aws_Bucket,
    Key: key,
  });

  return await getSignedUrl(s3, command, {
    expiresIn: 60 * 5, // 5 minutes
  });
}; 