"use client"

import { useState, useTransition, useRef } from "react"
import { toast } from "sonner"
import { createColumn } from "@/lib/actions/columns"
import { useBoardSyncContext } from "./BoardSyncContext"

export function NewColumnForm({ boardId }: { boardId: string }) {
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
      const res = await createColumn(boardId, title)
      if (res?.error) toast.error(res.error)
      else {
        toast.success("Sütun oluşturuldu")
        setTitle("")
        setOpen(false)
      }
    })
  }

  if (!open) {
    return (
      <div style={{ flexShrink: 0, width: "260px" }}>
        <button
          onClick={handleOpen}
          style={{
            width: "100%",
            background: "rgba(255,249,239,0.25)",
            border: "2px dashed rgba(255,249,239,0.5)",
            color: "rgba(255,249,239,0.8)",
            fontFamily: "inherit",
            fontSize: "1.05rem",
            padding: "16px",
            cursor: "pointer",
            textAlign: "left",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,249,239,0.35)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,249,239,0.25)"
          }}
        >
          + sütun ekle
        </button>
      </div>
    )
  }

  return (
    <div style={{ flexShrink: 0, width: "260px" }}>
      <div className="paper-column" style={{ padding: "1rem" }}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Sütun adı..."
            className="ink-input"
            style={{ fontSize: "1.1rem" }}
            disabled={isPending}
            onKeyDown={(e) => {
              if (e.key === "Escape") { setOpen(false); setTitle("") }
            }}
          />
          <div style={{ display: "flex", gap: "6px" }}>
            <button type="submit" disabled={isPending || !title.trim()} className="stamp-btn" style={{ flex: 1, fontSize: "0.95rem" }}>
              {isPending ? "..." : "Ekle"}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setTitle("") }}
              className="ghost-btn"
              style={{ fontSize: "0.9rem" }}
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
