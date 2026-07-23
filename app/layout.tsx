import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import LayoutShell from "./components/LayoutShell";
import { InformationProvider } from "./components/Information";
import ServiceWorkerRegister from "./components/ServiceWorkerRegister";
InformationProvider

// Display face — confident geometric sans for headings & numbers
const heading = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "600", "700", "800"],
});

// Body face — clean and legible for dense tables/lists
const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "KhetiBahi — Farm Expense Tracker",
  description:
    "Track pesticide, fertilizer, seed, labor, and transport costs for your farm.",
  // app/manifest.ts already generates /manifest.webmanifest and Next.js
  // auto-links it — appleWebApp + icons below cover what iOS Safari
  // still needs its own way (it ignores the manifest for install icons).
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KhetiBahi",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#1f6b45",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: the "dark" class is toggled client-side
    <html
      lang="en"
      suppressHydrationWarning
      className={`${heading.variable} ${body.variable}`}
    >
      <body className="font-sans antialiased bg-canvas text-ink">
        <ServiceWorkerRegister />
        <InformationProvider>
          <AuthProvider>
            {/*
              LayoutShell is a Client Component that decides which chrome to
              render:
                - Auth pages (/login, /signup) → no sidebar, no topbar, just children
                - App pages → sidebar + topbar + main content + mobile nav
            */}
            <LayoutShell>{children}</LayoutShell>
          </AuthProvider>
        </InformationProvider>
      </body>
    </html>
  );
}