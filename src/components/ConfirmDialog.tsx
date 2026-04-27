"use client"

import { useEffect, useRef } from "react"

type Props = {
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ message, onConfirm, onCancel }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelRef.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onCancel])

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(44,24,16,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        className="paper-card"
        style={{
          width: "100%",
          maxWidth: 360,
          padding: "2rem 1.75rem",
          transform: "rotate(-0.5deg)",
          position: "relative",
        }}
      >
        <p
          style={{
            fontSize: "1.1rem",
            color: "#2C1810",
            lineHeight: 1.5,
            marginBottom: "1.5rem",
          }}
        >
          {message}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            ref={cancelRef}
            onClick={onCancel}
            style={{
              background: "transparent",
              border: "1.5px solid rgba(44,24,16,0.2)",
              color: "#8A6A58",
              fontFamily: "inherit",
              fontSize: "1rem",
              padding: "8px 20px",
              cursor: "pointer",
            }}
          >
            İptal
          </button>
          <button
            onClick={onConfirm}
            style={{
              background: "#2C1810",
              border: "none",
              color: "#FFF9EF",
              fontFamily: "inherit",
              fontSize: "1rem",
              fontWeight: 700,
              padding: "8px 20px",
              cursor: "pointer",
            }}
          >
            Sil
          </button>
        </div>
      </div>
    </div>
  )
}
