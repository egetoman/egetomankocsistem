"use client"

import { useState, useTransition, useRef } from "react"
import { toast } from "sonner"
import { createBoard } from "@/lib/actions/boards"

export function NewBoardForm() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleOpen() {
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    startTransition(async () => {
      const res = await createBoard(title)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success("Pano oluşturuldu!")
        setTitle("")
        setOpen(false)
      }
    })
  }

  if (!open) {
    return (
      <div
        onClick={handleOpen}
        style={{
          transform: "rotate(0.3deg)",
          cursor: "pointer",
        }}
      >
        <div
          className="paper-column"
          style={{
            padding: "1.5rem 1.25rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "120px",
            border: "2px dashed rgba(44,24,16,0.15)",
            background: "rgba(255,249,239,0.6)",
            boxShadow: "none",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#FFF9EF"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,249,239,0.6)"
          }}
        >
          <span style={{ fontSize: "2rem", color: "#C4A882", lineHeight: 1 }}>+</span>
          <span style={{ fontSize: "1rem", color: "#8A6A58", marginTop: "0.5rem" }}>
            Yeni pano
          </span>
        </div>
      </div>
    )
  }

  return (
    <div style={{ transform: "rotate(-0.3deg)" }}>
      <div
        className="paper-column"
        style={{ padding: "1.5rem 1.25rem" }}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Pano adı..."
            className="ink-input"
            style={{ fontSize: "1.3rem" }}
            disabled={isPending}
          />
          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <button type="submit" disabled={isPending || !title.trim()} className="stamp-btn" style={{ flex: 1 }}>
              {isPending ? "..." : "Oluştur"}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setTitle("") }}
              className="ghost-btn"
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
