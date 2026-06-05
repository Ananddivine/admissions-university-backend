import { PutObjectCommand } from '@aws-sdk/client-s3';
import s3 from '../config/s3.js';
import { v4 as uuid } from 'uuid';

export const uploadToS3 = async (file, folder = 'students') => {
  const fileKey = `${folder}/${uuid()}-${file.originalname}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3.send(command);

  return {
    key: fileKey,
    url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`,
  };
};