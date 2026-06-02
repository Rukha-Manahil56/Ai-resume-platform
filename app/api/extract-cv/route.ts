import { NextRequest, NextResponse } from "next/server";
// pdf-parse is CommonJS — must use require, not import
const pdfParse = require("pdf-parse") as (
  buffer: Buffer
) => Promise<{ text: string; numpages: number }>;

// pdf-parse needs Node.js APIs — not the Edge runtime
export const runtime = "nodejs";

/** Maximum PDF upload size: 10 MB */
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * POST /api/extract-cv
 * Accepts a multipart form upload with a "file" field (PDF only).
 * Always returns JSON — never HTML.
 */
export async function POST(request: NextRequest) {
  try {
    // ── 1. Parse the multipart form ──────────────────────────────────────
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "Could not read the uploaded file. Please try again." },
        { status: 400 }
      );
    }

    const file = formData.get("file");

    // ── 2. Validate the file ─────────────────────────────────────────────
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No PDF file was uploaded." },
        { status: 400 }
      );
    }

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      return NextResponse.json(
        { error: "Only PDF files are allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File is too large. Maximum size is 10 MB." },
        { status: 400 }
      );
    }

    // ── 3. Convert to Buffer ─────────────────────────────────────────────
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ── 4. Extract text with pdf-parse ───────────────────────────────────
    // pdfParse is a plain async function — not a class
    let result: { text: string };
    try {
      result = await pdfParse(buffer);
    } catch (parseError) {
      console.error("[extract-cv] pdf-parse failed:", parseError);
      return NextResponse.json(
        { error: "Could not extract text from this PDF. Make sure it is not scanned or image-only." },
        { status: 422 }
      );
    }

    const text = result.text.trim();

    if (!text) {
      return NextResponse.json(
        { error: "No text found in this PDF. It may be a scanned image — try a text-based PDF." },
        { status: 422 }
      );
    }

    // ── 5. Return extracted text ─────────────────────────────────────────
    return NextResponse.json({ text, fileName: file.name });

  } catch (error) {
    // Catch-all — always return JSON, never let Next.js return HTML
    console.error("[extract-cv] unexpected error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try a different PDF." },
      { status: 500 }
    );
  }
}