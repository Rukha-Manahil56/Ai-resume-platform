import { AppSidebar } from "@/components/app-sidebar";

/**
 * Layout for authenticated app pages (dashboard, analyzer, etc.).
 * Wraps content with the dark sidebar navigation.
 */
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 overflow-auto bg-white text-zinc-900">
        {children}
      </main>
    </div>
  );
}
