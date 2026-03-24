import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FitVision — AI-Powered Fitness",
  description: "Computer-vision-first fitness app. Snap a photo, the AI handles the rest.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased">
      <body className="font-sans bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        {children}
      </body>
    </html>
  );
}
