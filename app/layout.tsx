import "./globals.css";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* 🌌 BACKGROUND */}
        <div className="space-bg">
          <div className="stars" />
        </div>

        {/* 🧱 APP CONTENT */}
        <div className="relative z-10 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
