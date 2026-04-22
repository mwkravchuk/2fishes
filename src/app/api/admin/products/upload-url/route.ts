import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createPresignedProductImageUpload } from "@/lib/s3";

type RequestBody = {
  slug: string;
  filename?: string;
  contentType: string;
};

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized",
      },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as RequestBody;

    if (!body.slug?.trim()) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing slug",
        },
        { status: 400 }
      );
    }

    if (!body.contentType?.startsWith("image/")) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid content type",
        },
        { status: 400 }
      );
    }

    const result = await createPresignedProductImageUpload({
      slug: body.slug.trim(),
      filename: body.filename,
      contentType: body.contentType,
    });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to create upload URL",
      },
      { status: 500 }
    );
  }
}
