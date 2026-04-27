"use client"

import { useState, useTransition, useEffect } from "react"
import { toast } from "sonner"
import { updateCard, deleteCard } from "@/lib/actions/cards"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { useBoardSyncContext } from "./BoardSyncContext"
import type { Card } from "@/generated/prisma"

type Props = {
  card: Card
  onClose: () => void
}

export function CardModal({ card, onClose }: Props) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description ?? "")
  const [dueDate, setDueDate] = useState(
    card.dueDate ? card.dueDate.toISOString().slice(0, 10) : ""
  )
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDeleting] = useTransition()
  const { notifyMutated } = useBoardSyncContext()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  function handleSave() {
    if (!title.trim()) return
    notifyMutated()
    startTransition(async () => {
      const res = await updateCard(card.id, {
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
      })
      if (res?.error) toast.error(res.error)
      else {
        toast.success("Kaydedildi")
        onClose()
      }
    })
  }

  function handleDelete() {
    setConfirmOpen(true)
  }

  function confirmDelete() {
    setConfirmOpen(false)
    notifyMutated()
    startDeleting(async () => {
      await deleteCard(card.id)
      toast.success("Kart silindi")
      onClose()
    })
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(44,24,16,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="paper-card"
        style={{
          width: "100%",
          maxWidth: "480px",
          padding: "2rem",
          transform: "rotate(-0.3deg)",
          position: "relative",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "12px",
            right: "14px",
            background: "transparent",
            border: "none",
            fontSize: "1.2rem",
            color: "#8A6A58",
            cursor: "pointer",
            fontFamily: "inherit",
            lineHeight: 1,
          }}
        >
          ✕
        </button>

        <div className="flex flex-col gap-5">
          <div>
            <label style={{ display: "block", color: "#8A6A58", fontSize: "0.9rem", marginBottom: "4px" }}>
              Başlık
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="ink-input"
              style={{ fontSize: "1.3rem", fontWeight: 600 }}
            />
          </div>

          <div>
            <label style={{ display: "block", color: "#8A6A58", fontSize: "0.9rem", marginBottom: "4px" }}>
              Açıklama
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Notlar, detaylar..."
              style={{
                background: "transparent",
                border: "none",
                borderBottom: "1.5px solid #C4A882",
                borderRadius: 0,
                outline: "none",
                fontFamily: "var(--font-hand), cursive",
                fontSize: "1.1rem",
                color: "#2C1810",
                width: "100%",
                resize: "vertical",
                padding: "4px 2px",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", color: "#8A6A58", fontSize: "0.9rem", marginBottom: "4px" }}>
              Son tarih
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="ink-input"
            />
          </div>

          <div style={{ display: "flex", gap: "8px", paddingTop: "4px" }}>
            <button
              onClick={handleSave}
              disabled={isPending || !title.trim()}
              className="stamp-btn"
              style={{ flex: 1 }}
            >
              {isPending ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              style={{
                background: "transparent",
                border: "1.5px solid rgba(44,24,16,0.2)",
                color: "#8A6A58",
                fontFamily: "inherit",
                fontSize: "1rem",
                padding: "8px 16px",
                cursor: "pointer",
              }}
            >
              {isDeleting ? "..." : "Sil"}
            </button>
          </div>
        </div>
      </div>

      {confirmOpen && (
        <ConfirmDialog
          message="Bu kartı silmek istiyor musun?"
          onConfirm={confirmDelete}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  )
}
