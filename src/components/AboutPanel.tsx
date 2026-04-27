"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"

const SEEN_KEY = "taskflow_about_seen"

export function AboutPanel() {
  const [open, setOpen] = useState(false)
  const [beating, setBeating] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!localStorage.getItem(SEEN_KEY)) {
      setBeating(true)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    // Mark as seen — stop beating permanently
    localStorage.setItem(SEEN_KEY, "1")
    setBeating(false)

    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  return (
    <>
      <style>{`
        @keyframes heartbeat {
          0%   { transform: scale(1); }
          14%  { transform: scale(1.3); }
          28%  { transform: scale(1); }
          42%  { transform: scale(1.18); }
          56%  { transform: scale(1); }
          100% { transform: scale(1); }
        }
        .heart-beat {
          animation: heartbeat 1.4s ease-in-out infinite;
        }
      `}</style>

      <div
        ref={panelRef}
        style={{ position: "fixed", bottom: 20, right: 20, zIndex: 150 }}
      >
        {open && (
          <div
            className="paper-card"
            style={{
              position: "absolute",
              bottom: "calc(100% + 12px)",
              right: 0,
              width: 320,
              padding: "1.6rem 1.75rem 1.4rem",
              transform: "rotate(-0.4deg)",
              boxShadow: "4px 8px 28px rgba(44,24,16,0.22)",
            }}
          >
            <button
              onClick={() => setOpen(false)}
              style={{
                position: "absolute",
                top: 10,
                right: 12,
                background: "transparent",
                border: "none",
                fontSize: "1rem",
                color: "#C4A882",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ✕
            </button>

            <p style={{ fontSize: "1.15rem", fontWeight: 700, color: "#2C1810", marginBottom: "0.75rem", lineHeight: 1.3 }}>
              Merhaba Koçsistem! 👋
            </p>

            <p style={{ fontSize: "0.95rem", color: "#4A2E20", lineHeight: 1.65, marginBottom: "1rem" }}>
              Elle çizilmiş kağıt deftere benzeyen, sade ama güçlü bir Kanban pano uygulaması tasarladım.
            </p>

            <p style={{ fontSize: "0.92rem", color: "#6A4A38", lineHeight: 1.65, marginBottom: "1rem" }}>
              Kartlarınızı sürükle-bırak ile taşıyabilir, sütunlar oluşturabilir, takım arkadaşlarınızı davet edip aynı panoda birlikte çalışabilirsiniz. Kart detaylarına tıklayarak notlar ve deadline ekleyebilirsiniz.
            </p>

            <p style={{ fontSize: "0.92rem", color: "#6A4A38", lineHeight: 1.65, marginBottom: "1.1rem" }}>
              Altında <strong>Next.js 16, Prisma, Neon Postgres ve Auth.js</strong> yatıyor. Uygulama polling tabanlı ve değişiklikler birkaç saniye içinde diğer kullanıcılara yansıyor. Bu sayede senkron bir şekilde çalışabilirsiniz. Kodun büyük kısmı TypeScript ile yazıldı, böylece tip güvenliği sağlanarak daha sağlam bir uygulama ortaya çıktı.
            </p>

            <div
              style={{
                borderTop: "1px solid rgba(196,168,130,0.35)",
                paddingTop: "0.85rem",
                fontSize: "0.88rem",
                color: "#C4A882",
                lineHeight: 1.5,
              }}
            >
              Test ettiğiniz için teşekkürler 🙏<br />
              Sorularınız için her zaman buradayım.<br />
              tomanege@gmail.com
            </div>
          </div>
        )}

        <button
          onClick={() => setOpen((v) => !v)}
          title="Proje hakkında"
          style={{
            background: "transparent",
            border: "none",
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <Image
            src="/love.png"
            alt="Hakkında"
            width={30}
            height={30}
            className={beating ? "heart-beat" : undefined}
            style={{ filter: "invert(1)", opacity: open ? 1 : 0.85 }}
          />
        </button>
      </div>
    </>
  )
}
