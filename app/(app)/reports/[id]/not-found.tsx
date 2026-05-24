import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function ReportNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">Report not found</h1>
      <p className="max-w-md text-muted-foreground">
        This analysis may have been deleted, or you may not have permission to
        view it.
      </p>
      <Link href="/reports" className={buttonVariants()}>
        Back to reports
      </Link>
    </div>
  );
}
