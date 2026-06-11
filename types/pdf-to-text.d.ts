declare module "pdf-to-text" {
  interface PDF {
    pdfToText(
      filePath: string,
      options: Record<string, unknown>,
      callback: (err: unknown, text: string) => void
    ): void;
  }

  const pdf: PDF;
  export default pdf;
}
