"use client"

import { useState, useTransition, useRef } from "react"
import { toast } from "sonner"
import { createCard } from "@/lib/actions/cards"
import { useBoardSyncContext } from "./BoardSyncContext"

export function NewCardForm({ columnId }: { columnId: string }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [isPending, startTransition] = useTransition()
  const { notifyMutated } = useBoardSyncContext()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleOpen() {
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    notifyMutated()
    startTransition(async () => {
      const res = await createCard(columnId, title)
      if (res?.error) toast.error(res.error)
      else {
        setTitle("")
        setOpen(false)
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="ghost-btn"
        style={{ width: "100%", textAlign: "left" }}
      >
        + kart ekle
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Kart başlığı..."
        className="ink-input"
        disabled={isPending}
        onKeyDown={(e) => {
          if (e.key === "Escape") { setOpen(false); setTitle("") }
        }}
      />
      <div style={{ display: "flex", gap: "6px" }}>
        <button type="submit" disabled={isPending || !title.trim()} className="stamp-btn" style={{ fontSize: "0.95rem", padding: "5px 14px" }}>
          {isPending ? "..." : "Ekle"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setTitle("") }}
          style={{
            background: "transparent",
            border: "none",
            color: "#8A6A58",
            fontFamily: "inherit",
            fontSize: "0.95rem",
            cursor: "pointer",
            padding: "5px 8px",
          }}
        >
          İptal
        </button>
      </div>
    </form>
  )
}
