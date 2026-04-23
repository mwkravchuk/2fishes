import type { NextConfig } from "next";

const bucket = process.env.S3_BUCKET_NAME;
const region = process.env.AWS_REGION;

const nextConfig: NextConfig = {
  images: {
    remotePatterns:
      bucket && region
        ? [
            {
              protocol: "https",
              hostname: `${bucket}.s3.${region}.amazonaws.com`,
              pathname: "/**",
            },
          ]
        : [],
  },
};

export default nextConfig;
