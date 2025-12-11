import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { ToastProvider } from "@/components/ui/toast"
import { AssetProvider } from "@/contexts/asset-context"
import { AuthProvider } from "@/contexts/auth-context"
import { WalletProvider } from "@/contexts/wallet-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "ACE Exchange - The Future of Crypto Trading",
  description: "The world's most advanced, secure, and rewarding cryptocurrency exchange",
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=5",
  themeColor: "#001219",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#001219" />
      </head>
      <body className={`${inter.className} bg-ace-dark text-white overflow-x-hidden`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <AuthProvider>
            <WalletProvider>
              <AssetProvider>
                <ToastProvider>
                  <div className="space-bg">
                    <div className="stars" />
                  </div>
                  {children}
                </ToastProvider>
              </AssetProvider>
            </WalletProvider>
          </AuthProvider>
        </ThemeProvider>
      {/* v0 – built-with badge */}
  <div dangerouslySetInnerHTML={{ __html: `<div id="v0-built-with-button-1937883c-cec0-410d-b960-298d6464d57d" style="
border: 1px solid hsl(0deg 0% 100% / 12%);
position: fixed;
bottom: 24px;
right: 24px;
z-index: 1000;
background: #121212;
color: white;
padding: 8px 12px;
border-radius: 8px;
font-weight: 400;
font-size: 14px;
box-shadow: 0 2px 8px rgba(0,0,0,0.12);
letter-spacing: 0.02em;
transition: all 0.2s;
display: flex;
align-items: center;
gap: 4px;
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
">
<a
  href="https://v0.app/chat/api/open/built-with-v0/b_1QnKhlg2mhn?ref=NSLZNP"
  target="_blank"
  rel="noopener"
  style="
    color: inherit;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 4px;
  "
>
  Built with
  <svg
    fill="currentColor"
    viewBox="0 0 147 70"
    xmlns="http://www.w3.org/2000/svg"
    style="width: 20px; height: 20px;"
  >
    <path d="M56 50.2031V14H70V60.1562C70 65.5928 65.5928 70 60.1562 70C57.5605 70 54.9982 68.9992 53.1562 67.1573L0 14H19.7969L56 50.2031Z" />
    <path d="M147 56H133V23.9531L100.953 56H133V70H96.6875C85.8144 70 77 61.1856 77 50.3125V14H91V46.1562L123.156 14H91V0H127.312C138.186 0 147 8.81439 147 19.6875V56Z" />
  </svg>
</a>

<button
  onclick="document.getElementById('v0-built-with-button-1937883c-cec0-410d-b960-298d6464d57d').style.display='none'"
  onmouseenter="this.style.opacity='1'"
  onmouseleave="this.style.opacity='0.7'"
  style="
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    padding: 2px;
    margin-left: 4px;
    border-radius: 2px;
    display: flex;
    align-items: center;
    opacity: 0.7;
    transition: opacity 0.2s;
    transform: translateZ(0);
  "
  aria-label="Close"
>
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
</button>

<span style="
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
">
  v0
</span>
</div>` }} />
</body>
    </html>
  )
}