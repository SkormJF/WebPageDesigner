import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

/* Placeholder faces. Replace both with the families design-system.md names,
   keeping the `variable` names -- globals.css resolves --font-sans and
   --font-mono through them, and renaming one side only silently drops the
   font back to the browser default without failing the build. */
const sans = Geist({
  variable: "--font-sans-face",
  subsets: ["latin"],
  display: "swap",
});

const mono = Geist_Mono({
  variable: "--font-mono-face",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Generated project",
  description: "Replace from PROJECT.md and design.md.",
};

/* `lang` must match the product language declared in PROJECT.md -- not the
   language of the conversation that produced it. */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
