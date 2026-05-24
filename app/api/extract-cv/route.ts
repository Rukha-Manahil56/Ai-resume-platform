import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";

// pdf-parse needs Node.js APIs (Buffer, etc.) — not the Edge runtime
export const runtime = "nodejs";

/** Maximum PDF upload size: 10 MB */
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Read the uploaded file from the request and return a Node.js Buffer.
 * The client sends the PDF as multipart form data under the key "file".
 */
async function getPdfBufferFromRequest(
  request: NextRequest
): Promise<{ buffer: Buffer; fileName: string } | { error: string; status: number }> {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return { error: "No PDF file was uploaded.", status: 400 };
  }

  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return { error: "Only PDF files are allowed.", status: 400 };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { error: "File is too large. Maximum size is 10 MB.", status: 400 };
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return { buffer, fileName: file.name };
}

/**
 * Use pdf-parse to pull plain text out of a PDF buffer.
 * Returns the full document text as one string.
 */
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return result.text.trim();
  } finally {
    // Always release memory held by the parser
    await parser.destroy();
  }
}

/**
 * POST /api/extract-cv
 * Accepts a PDF file, extracts text, and returns JSON: { text: "..." }
 */
export async function POST(request: NextRequest) {
  try {
    const fileResult = await getPdfBufferFromRequest(request);

    if ("error" in fileResult) {
      return NextResponse.json(
        { error: fileResult.error },
        { status: fileResult.status }
      );
    }

    const text = await extractTextFromPdf(fileResult.buffer);

    if (!text) {
      return NextResponse.json(
        { error: "No text could be extracted from this PDF." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      text,
      fileName: fileResult.fileName,
    });
  } catch (error) {
    console.error("[extract-cv]", error);
    return NextResponse.json(
      { error: "Failed to extract text from the PDF. Please try another file." },
      { status: 500 }
    );
  }
}
