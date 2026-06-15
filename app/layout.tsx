import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CareerLens",
  description: "Analyze resumes, practice interviews, and track your progress",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen bg-background text-foreground font-sans">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function () {
  var bold   = "font-family:monospace;font-size:11px;font-weight:700;";
  var muted  = "font-family:monospace;font-size:11px;color:#6B7280;line-height:2;";
  var green  = "font-family:monospace;font-size:11px;color:#10B981;font-weight:700;";
  var name   = "font-family:monospace;font-size:11px;color:#ffffff;font-weight:700;";
  var link   = "font-family:monospace;font-size:11px;color:#7dd3fc;text-decoration:underline;";
  var rule   = "font-family:monospace;font-size:11px;color:#2a2a2a;";

  console.log("%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", rule);
  console.log("%c  You have a good eye. 👀", green);
  console.log("%c  Most people use the product.", muted);
  console.log("%c  You wanted to see how it was made.", muted);
  console.log("%c  That kind of curiosity is rare — and it matters.", muted);
  console.log(" ");
  console.log(
    "%c  CareerLens was designed and built from scratch%c\n  by %cRukha Manahil%c — every screen, every\n  interaction, every detail. No templates.",
    muted, muted, name, muted
  );
  console.log(" ");
  console.log("%c  Say hello →  linkedin.com/in/rukha-manahil-798572340", link);
  console.log("%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", rule);
})();
            `,
          }}
        />
      </body>
    </html>
  );
}