"use client"

import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { CardModal } from "./CardModal"
import type { Card } from "@/generated/prisma"

const ROTATIONS = ["-0.5deg", "0.3deg", "-0.3deg", "0.5deg", "-0.4deg", "0.2deg"]

type Props = {
  card: Card
  index: number
  columnId: string
}

export function CardItem({ card, index, columnId }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { type: "card", card, columnId },
  })

  const rotation = ROTATIONS[index % ROTATIONS.length]
  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date()

  // Placeholder shown in the original slot while dragging
  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={{
          height: 64,
          border: "2px dashed rgba(44,24,16,0.2)",
          background: "rgba(255,253,240,0.35)",
          transform: CSS.Transform.toString(transform),
          transition,
          flexShrink: 0,
        }}
      />
    )
  }

  return (
    <>
      <div
        ref={setNodeRef}
        className="paper-card"
        {...attributes}
        {...listeners}
        onClick={() => setModalOpen(true)}
        style={{
          padding: "0.75rem 0.875rem 0.625rem",
          transform: `${CSS.Transform.toString(transform) ?? ""} rotate(${rotation})`,
          transition,
          cursor: "grab",
          userSelect: "none",
          flexShrink: 0,
        }}
      >
        <p style={{ fontSize: "1.05rem", fontWeight: 600, color: "#2C1810", lineHeight: 1.35, wordBreak: "break-word" }}>
          {card.title}
        </p>
        {card.description && (
          <p
            style={{
              fontSize: "0.88rem",
              color: "#8A6A58",
              marginTop: "4px",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {card.description}
          </p>
        )}
        {card.dueDate && (
          <p
            style={{
              fontSize: "0.82rem",
              color: isOverdue ? "#C0392B" : "#8A6A58",
              marginTop: "6px",
              fontWeight: isOverdue ? 600 : 400,
            }}
          >
            {isOverdue ? "⚠ " : "📅 "}
            {new Date(card.dueDate).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
          </p>
        )}
      </div>

      {modalOpen && <CardModal card={card} onClose={() => setModalOpen(false)} />}
    </>
  )
}
