"use client"

import { useState, useTransition } from "react"
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { toast } from "sonner"
import { deleteColumn, updateColumnTitle } from "@/lib/actions/columns"
import { CardItem } from "./CardItem"
import { NewCardForm } from "./NewCardForm"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { useBoardSyncContext } from "./BoardSyncContext"
import type { Card, Column as ColumnType } from "@/generated/prisma"

const COLUMN_ACCENTS = ["#E8A060", "#7BAE7F", "#D4857C", "#7B9EC7", "#B5A0D4", "#F5C842"]

function hashAccent(id: string, len: number) {
  let h = 0
  for (const c of id) h = ((h << 5) - h) + c.charCodeAt(0)
  return Math.abs(h) % len
}

type ColumnWithCards = ColumnType & { cards: Card[] }

export function Column({ column }: { column: ColumnWithCards }) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(column.title)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDeleting] = useTransition()

  const accent = COLUMN_ACCENTS[hashAccent(column.id, COLUMN_ACCENTS.length)]
  const { notifyMutated } = useBoardSyncContext()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: "column", column },
  })

  function handleTitleSave() {
    if (!titleDraft.trim() || titleDraft === column.title) {
      setIsEditingTitle(false)
      setTitleDraft(column.title)
      return
    }
    notifyMutated()
    startTransition(async () => {
      const res = await updateColumnTitle(column.id, titleDraft)
      if (res?.error) {
        toast.error(res.error)
        setTitleDraft(column.title)
      }
      setIsEditingTitle(false)
    })
  }

  function handleDelete() {
    setConfirmOpen(true)
  }

  function confirmDelete() {
    setConfirmOpen(false)
    notifyMutated()
    startDeleting(async () => {
      await deleteColumn(column.id)
      toast.success("Sütun silindi")
    })
  }

  // Skeleton placeholder shown in the original slot while the column is being dragged
  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={{
          flexShrink: 0,
          width: 280,
          minHeight: 120,
          border: "2px dashed rgba(255,249,239,0.35)",
          background: "rgba(255,249,239,0.06)",
          transform: CSS.Transform.toString(transform),
          transition,
        }}
      />
    )
  }

  return (
    <div
      ref={setNodeRef}
      className="paper-column column-wrapper"
      style={{
        flexShrink: 0,
        width: 280,
        display: "flex",
        flexDirection: "column",
        maxHeight: "calc(100vh - 130px)",
        opacity: isDeleting ? 0.5 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      {/* Colored accent strip */}
      <div style={{ height: 4, background: accent, flexShrink: 0 }} />

      {/* Header */}
      <div
        style={{
          padding: "8px 10px 8px",
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
          borderBottom: "1px solid rgba(196,168,130,0.3)",
          gap: 4,
        }}
      >
        {/* Drag handle — appears on hover via CSS */}
        <div className="column-handle" {...listeners} {...attributes} title="Sütunu sürükle">
          ⠿
        </div>

        {isEditingTitle ? (
          <input
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTitleSave()
              if (e.key === "Escape") { setIsEditingTitle(false); setTitleDraft(column.title) }
            }}
            className="ink-input"
            style={{ fontSize: "1.05rem", fontWeight: 700, flex: 1 }}
            autoFocus
            disabled={isPending}
          />
        ) : (
          <button
            onClick={() => setIsEditingTitle(true)}
            style={{
              background: "transparent",
              border: "none",
              fontFamily: "inherit",
              fontSize: "1.05rem",
              fontWeight: 700,
              color: "#2C1810",
              cursor: "text",
              padding: 0,
              flex: 1,
              textAlign: "left",
            }}
          >
            {column.title}
          </button>
        )}

        <span style={{ fontSize: "0.8rem", color: "#C4A882", flexShrink: 0 }}>
          {column.cards.length}
        </span>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          style={{
            background: "transparent",
            border: "none",
            color: "#C4A882",
            cursor: "pointer",
            fontSize: "0.85rem",
            padding: "2px 4px",
            fontFamily: "inherit",
            lineHeight: 1,
            flexShrink: 0,
          }}
          title="Sütunu sil"
        >
          ✕
        </button>
      </div>

      {/* Cards */}
      <SortableContext items={column.cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "10px 10px 6px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            minHeight: 40,
          }}
        >
          {column.cards.map((card, i) => (
            <CardItem key={card.id} card={card} index={i} columnId={column.id} />
          ))}
        </div>
      </SortableContext>

      {/* Add card */}
      <div style={{ padding: "6px 10px 10px", flexShrink: 0 }}>
        <NewCardForm columnId={column.id} />
      </div>

      {confirmOpen && (
        <ConfirmDialog
          message={`"${column.title}" sütununu ve tüm kartları silmek istiyor musun?`}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  )
}
