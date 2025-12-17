import { S3Client } from "@aws-sdk/client-s3";

export const Aws_Bucket = process.env.AWS_BUCKET_NAME;

export const s3 = new S3Client({
    region:process.env.AWS_DEFAULT_REGION,
    credentials:{
        accessKeyId:process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY
    }
})