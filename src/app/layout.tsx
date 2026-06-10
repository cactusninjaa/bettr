import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { CelebrationProvider } from "@/components/CelebrationProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bettr",
  description: "Paris sportifs en argent fictif, entre amis.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  let soundEnabled = true;
  if (session?.user?.id) {
    const u = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { soundEnabled: true },
    });
    if (u) soundEnabled = u.soundEnabled;
  }

  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CelebrationProvider soundEnabled={soundEnabled}>{children}</CelebrationProvider>
      </body>
    </html>
  );
}
