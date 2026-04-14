import { NextRequest, NextResponse } from "next/server";
import { uploadToS3 } from "@/lib/s3";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const result = await uploadToS3(file);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}