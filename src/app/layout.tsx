import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { pinar } from "./fonts";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "سامانه شاطبی",
  description: "سیستم مدیریت یکپارچه اطلاعات",
  icons: {
    icon: [
      {
        url: "/fav-icon.png",
        type: "image/png",
        sizes: "192x192",
      },
    ],
    apple: [
      {
        url: "/fav-icon.png",
        type: "image/png",
        sizes: "192x192",
      },
    ],
    shortcut: ["/fav-icon.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning className={pinar.variable}>
      <body className={pinar.className}>
        <Providers>
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
