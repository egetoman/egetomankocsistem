"use client"

import { useState, useTransition, useRef } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, horizontalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import Link from "next/link"
import Image from "next/image"
import { Column } from "./Column"
import { NewColumnForm } from "./NewColumnForm"
import { ShareModal } from "./ShareModal"
import { BoardSyncContext } from "./BoardSyncContext"
import { useBoardSync } from "@/hooks/useBoardSync"
import { moveCard } from "@/lib/actions/cards"
import { reorderColumn } from "@/lib/actions/columns"
import type { Board, Column as ColumnType, Card } from "@/generated/prisma"

type ColumnWithCards = ColumnType & { cards: Card[] }
type BoardWithColumns = Board & { columns: ColumnWithCards[] }

type Member = {
  id: string
  role: string
  user: { id: string; name: string | null; email: string }
}

type PendingInvite = {
  id: string
  email: string
  token: string
  createdAt: Date
}

type DragItem =
  | { type: "card"; card: Card; columnId: string }
  | { type: "column"; column: ColumnWithCards }

type Props = {
  board: BoardWithColumns
  isOwner: boolean
  members: Member[]
  pendingInvitations: PendingInvite[]
}

export function KanbanBoard({ board, isOwner, members, pendingInvitations }: Props) {
  const [columns, setColumns] = useState<ColumnWithCards[]>(board.columns)
  const [activeItem, setActiveItem] = useState<DragItem | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [, startTransition] = useTransition()

  const colsRef = useRef<ColumnWithCards[]>(columns)
  colsRef.current = columns

  const isDraggingRef = useRef(false)
  const { notifyMutated } = useBoardSync(board.id, isDraggingRef)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  function handleDragStart({ active }: DragStartEvent) {
    isDraggingRef.current = true
    const data = active.data.current
    if (data?.type === "card") {
      setActiveItem({ type: "card", card: data.card, columnId: data.columnId })
    } else if (data?.type === "column") {
      setActiveItem({ type: "column", column: data.column })
    }
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return
    const activeData = active.data.current
    const overData = over.data.current
    if (activeData?.type !== "card") return

    const sourceColId: string = activeData.columnId
    const destColId: string =
      overData?.type === "card" ? overData.columnId :
      overData?.type === "column" ? (over.id as string) : ""

    if (!destColId || sourceColId === destColId) return

    setColumns((prev) => {
      const sourceCol = prev.find((c) => c.id === sourceColId)
      const destCol = prev.find((c) => c.id === destColId)
      if (!sourceCol || !destCol) return prev

      const card = sourceCol.cards.find((c) => c.id === active.id)
      if (!card) return prev

      const insertIdx =
        overData?.type === "card"
          ? destCol.cards.findIndex((c) => c.id === over.id)
          : destCol.cards.length

      return prev.map((col) => {
        if (col.id === sourceColId) return { ...col, cards: col.cards.filter((c) => c.id !== active.id) }
        if (col.id === destColId) {
          const next = [...col.cards]
          next.splice(insertIdx, 0, card)
          return { ...col, cards: next }
        }
        return col
      })
    })

    setActiveItem((prev) =>
      prev?.type === "card" ? { ...prev, columnId: destColId } : prev
    )
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    isDraggingRef.current = false
    setActiveItem(null)
    if (!over) return

    const latest = colsRef.current
    const activeData = active.data.current
    const overData = over.data.current

    if (activeData?.type === "column") {
      if (active.id === over.id) return
      const oldIdx = latest.findIndex((c) => c.id === active.id)
      const newIdx = latest.findIndex((c) => c.id === over.id)
      if (oldIdx === newIdx) return
      const reordered = arrayMove(latest, oldIdx, newIdx)
      setColumns(reordered)
      const prevPos = reordered[newIdx - 1]?.position ?? null
      const nextPos = reordered[newIdx + 1]?.position ?? null
      notifyMutated()
      startTransition(() => void reorderColumn(active.id as string, prevPos, nextPos))
      return
    }

    if (activeData?.type === "card") {
      const finalCol = latest.find((col) => col.cards.some((c) => c.id === active.id))
      if (!finalCol) return

      const isCrossColumn = finalCol.id !== activeData.columnId

      if (isCrossColumn) {
        const cardIdx = finalCol.cards.findIndex((c) => c.id === active.id)
        const prevPos = finalCol.cards[cardIdx - 1]?.position ?? null
        const nextPos = finalCol.cards[cardIdx + 1]?.position ?? null
        notifyMutated()
        startTransition(() => void moveCard(active.id as string, finalCol.id, prevPos, nextPos))
        return
      }

      if (overData?.type === "card" && active.id !== over.id) {
        const colIdx = latest.findIndex((c) => c.id === finalCol.id)
        const oldIdx = finalCol.cards.findIndex((c) => c.id === active.id)
        const newIdx = finalCol.cards.findIndex((c) => c.id === over.id)
        if (oldIdx === newIdx || newIdx === -1) return
        const reordered = arrayMove(finalCol.cards, oldIdx, newIdx)
        const newCols = [...latest]
        newCols[colIdx] = { ...finalCol, cards: reordered }
        setColumns(newCols)
        const prevPos = reordered[newIdx - 1]?.position ?? null
        const nextPos = reordered[newIdx + 1]?.position ?? null
        notifyMutated()
        startTransition(() => void moveCard(active.id as string, finalCol.id, prevPos, nextPos))
      }
    }
  }

  return (
    <BoardSyncContext.Provider value={{ notifyMutated }}>
      <DndContext
        id="kanban-dnd"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          {/* Board breadcrumb */}
          <div
            style={{
              padding: "10px 24px",
              background: "rgba(44,24,16,0.3)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexShrink: 0,
            }}
          >
            <Link
              href="/boards"
              style={{ color: "rgba(255,249,239,0.65)", textDecoration: "none", fontSize: "1rem", fontFamily: "inherit" }}
            >
              ← Panolarım
            </Link>
            <span style={{ color: "rgba(255,249,239,0.35)" }}>/</span>
            <h1 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#FFF9EF", margin: 0, flex: 1 }}>
              {board.title}
            </h1>
            <button
              onClick={() => setShareOpen(true)}
              title={isOwner ? "Panoyu paylaş" : "Üyeleri gör"}
              style={{
                background: "transparent",
                border: "none",
                width: 44,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
                marginRight: 44,
                padding: 0,
              }}
            >
              <Image src="/person.png" alt={isOwner ? "Paylaş" : "Üyeler"} width={28} height={28} style={{ filter: "invert(1)", opacity: 0.85 }} />
            </button>
          </div>

          {/* Columns */}
          <SortableContext items={columns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
            <div
              style={{
                flex: 1,
                display: "flex",
                gap: 18,
                padding: 24,
                overflowX: "auto",
                alignItems: "flex-start",
              }}
            >
              {columns.map((col) => (
                <Column key={col.id} column={col} />
              ))}
              <NewColumnForm boardId={board.id} />
            </div>
          </SortableContext>

          {/* Floating drag overlay */}
          <DragOverlay dropAnimation={{ duration: 180, easing: "ease" }}>
            {activeItem?.type === "card" && (
              <div
                className="paper-card"
                style={{
                  width: 260,
                  padding: "0.75rem 0.875rem",
                  transform: "rotate(-1.5deg)",
                  boxShadow: "6px 12px 28px rgba(44,24,16,0.35)",
                  opacity: 0.96,
                  cursor: "grabbing",
                }}
              >
                <p style={{ fontSize: "1.05rem", fontWeight: 600, color: "#2C1810", lineHeight: 1.35 }}>
                  {activeItem.card.title}
                </p>
                {activeItem.card.description && (
                  <p style={{ fontSize: "0.88rem", color: "#8A6A58", marginTop: 4 }}>
                    {activeItem.card.description}
                  </p>
                )}
              </div>
            )}
            {activeItem?.type === "column" && (
              <div
                className="paper-column"
                style={{
                  width: 280,
                  opacity: 0.88,
                  boxShadow: "8px 16px 36px rgba(44,24,16,0.35)",
                  cursor: "grabbing",
                }}
              >
                <div style={{ height: 4, background: "#C4A882" }} />
                <div style={{ padding: "10px 12px", fontWeight: 700, fontSize: "1.05rem", color: "#2C1810" }}>
                  {activeItem.column.title}
                </div>
                <div style={{ padding: "0 12px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                  {activeItem.column.cards.slice(0, 3).map((card) => (
                    <div
                      key={card.id}
                      style={{
                        background: "#FFFDF0",
                        padding: "6px 8px",
                        fontSize: "0.9rem",
                        color: "#8A6A58",
                        border: "1px solid rgba(196,168,130,0.3)",
                      }}
                    >
                      {card.title}
                    </div>
                  ))}
                  {activeItem.column.cards.length > 3 && (
                    <p style={{ fontSize: "0.82rem", color: "#C4A882", textAlign: "center" }}>
                      +{activeItem.column.cards.length - 3} daha
                    </p>
                  )}
                </div>
              </div>
            )}
          </DragOverlay>
        </div>
      </DndContext>

      {shareOpen && (
        <ShareModal
          boardId={board.id}
          boardTitle={board.title}
          isOwner={isOwner}
          members={members}
          pendingInvitations={pendingInvitations}
          onClose={() => setShareOpen(false)}
        />
      )}
    </BoardSyncContext.Provider>
  )
}
