import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

function getExtensionFromContentType(contentType: string) {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

export function buildProductImageUploadKey(input: {
  slug: string;
  filename?: string;
  contentType: string;
}) {
  const timestamp = Date.now();
  const extension = getExtensionFromContentType(input.contentType);

  const safeSlug = input.slug
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");

  const safeFilename = input.filename ? sanitizeFilename(input.filename) : "";

  return `products/${safeSlug}-${timestamp}-${safeFilename || `image.${extension}`}`;
}

export async function createPresignedProductImageUpload(input: {
  slug: string;
  filename?: string;
  contentType: string;
}) {
  const key = buildProductImageUploadKey(input);

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: input.contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, {
    expiresIn: 60,
  });

  return {
    key,
    uploadUrl,
  };
}
