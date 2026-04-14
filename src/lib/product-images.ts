export function getProductImageUrl(imageKey: string) {
  const bucket = process.env.S3_BUCKET_NAME;
  const region = process.env.AWS_REGION;

  if (!bucket || !region) {
    throw new Error("Missing S3 bucket configuration");
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${imageKey}`;
}