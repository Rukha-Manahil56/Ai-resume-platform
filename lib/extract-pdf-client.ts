/**
 * Extracts plain text from a PDF entirely in the browser.
 * Uses pdfjs-dist legacy build which does not require a worker.
 */
export async function extractPdfTextInBrowser(file: File): Promise<string> {
  // Use the legacy build — it works without a worker setup
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // Point to the legacy worker bundled with the package
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.mjs",
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
  }).promise;

  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? (item as { str: string }).str : ""))
      .join(" ");
    pages.push(pageText);
  }

  return pages.join("\n\n").trim();
}