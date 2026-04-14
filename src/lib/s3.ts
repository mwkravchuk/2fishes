import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION;
const bucket = process.env.S3_BUCKET_NAME;

if (!region) throw new Error("Missing AWS_REGION");
if (!bucket) throw new Error("Missing S3_BUCKET_NAME");

const s3 = new S3Client({
  region,
});

function sanitizeFilename(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9.\-_]/g, "");
}

export async function uploadToS3(file: File, slug: string) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const timestamp = Date.now();

  const extension =
    file.name.split(".").pop()?.toLowerCase() ||
    file.type.split("/").pop()?.toLowerCase() ||
    "jpg";

  const safeSlug = slug
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");

  const safeFilename = sanitizeFilename(file.name);
  const key = `products/${safeSlug}-${timestamp}-${safeFilename || `image.${extension}`}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: file.type || "application/octet-stream",
  });

  await s3.send(command);

  return {
    key,
  };
}