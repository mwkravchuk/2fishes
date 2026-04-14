import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Create S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
});

export async function uploadToS3(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());

  // Generate a unique key
  const timestamp = Date.now();
  const safeName = file.name.replace(/\s+/g, "-").toLowerCase();
  const key = `products/${safeName}-${timestamp}`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: key,
    Body: buffer,
    ContentType: file.type,
  });

  await s3.send(command);

  return {
    key,
    url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
  };
}