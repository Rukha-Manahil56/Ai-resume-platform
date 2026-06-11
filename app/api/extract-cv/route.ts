import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * POST /api/extract-cv
 * Now receives plain text directly from the browser.
 * No PDF parsing needed on the server.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { text?: string; fileName?: string };

    if (!body.text || typeof body.text !== "string") {
      return NextResponse.json(
        { error: "No text received." },
        { status: 400 }
      );
    }

    const text = body.text.trim();

    if (text.length < 20) {
      return NextResponse.json(
        { error: "No readable text found in this PDF." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      text,
      fileName: body.fileName ?? "cv.pdf",
    });

  } catch (err) {
    console.error("[extract-cv] error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}