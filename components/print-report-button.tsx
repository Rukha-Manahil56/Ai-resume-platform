"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Triggers the browser print dialog for the current page.
 * Hidden when printing via the `no-print` CSS class.
 */
export function PrintReportButton() {
  function handlePrint() {
    window.print();
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="no-print gap-2"
      onClick={handlePrint}
    >
      <Printer className="size-4" />
      Print report
    </Button>
  );
}
