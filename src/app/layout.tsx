import type { Metadata } from "next"
import localFont from "next/font/local"
import { Toaster } from "sonner"
import "./globals.css"

const projectNote = localFont({
  src: "../../public/fonts/Project Note.otf",
  variable: "--font-hand",
  display: "swap",
})

export const metadata: Metadata = {
  title: "TaskFlow",
  description: "Kanban board",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${projectNote.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily: "var(--font-hand)",
              fontSize: "1.1rem",
              background: "#FFF9EF",
              border: "1px solid rgba(44,24,16,0.12)",
              color: "#2C1810",
            },
          }}
        />
      </body>
    </html>
  )
}
