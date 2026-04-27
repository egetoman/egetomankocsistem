"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { deleteBoard } from "@/lib/actions/boards"
import { NewBoardForm } from "./NewBoardForm"
import { ConfirmDialog } from "@/components/ConfirmDialog"

type BoardSummary = {
  id: string
  title: string
  userId: string
  createdAt: Date
  _count: { columns: number }
}

type Props = {
  boards: BoardSummary[]
  currentUserId: string
}

export function BoardGrid({ boards, currentUserId }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; title: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string, title: string) {
    setConfirmTarget({ id, title })
  }

  function confirmDelete() {
    if (!confirmTarget) return
    const { id } = confirmTarget
    setConfirmTarget(null)
    setDeletingId(id)
    startTransition(async () => {
      await deleteBoard(id)
      toast.success("Pano silindi")
      setDeletingId(null)
    })
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "1.5rem",
        alignItems: "start",
      }}
    >
      {boards.map((board, i) => {
        const rotations = ["-1.2deg", "0.8deg", "-0.5deg", "1deg", "-0.7deg", "0.4deg"]
        const rot = rotations[i % rotations.length]
        const isOwner = board.userId === currentUserId
        return (
          <div
            key={board.id}
            style={{
              transform: `rotate(${rot})`,
              position: "relative",
            }}
          >
            {/* Pushpin */}
            <div
              style={{
                position: "absolute",
                top: -10,
                left: "50%",
                transform: "translateX(-50%)",
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: isOwner
                  ? "radial-gradient(circle at 40% 35%, #E85D5D, #A02020)"
                  : "radial-gradient(circle at 40% 35%, #7BB4E8, #2060A0)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
                zIndex: 10,
              }}
            />
            <Link
              href={`/boards/${board.id}`}
              style={{ display: "block", textDecoration: "none" }}
            >
              <div
                className="paper-column"
                style={{
                  padding: "1.5rem 1.25rem 1rem",
                  cursor: "pointer",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)"
                  e.currentTarget.style.boxShadow =
                    "4px 8px 16px rgba(44,24,16,0.18), 0 0 0 1px rgba(44,24,16,0.08)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = ""
                }}
              >
                <p
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "#2C1810",
                    marginBottom: "0.5rem",
                    lineHeight: 1.2,
                    wordBreak: "break-word",
                  }}
                >
                  {board.title}
                </p>
                <p style={{ fontSize: "0.9rem", color: "#8A6A58" }}>
                  {board._count.columns} sütun
                </p>
                {!isOwner && (
                  <p style={{ fontSize: "0.78rem", color: "#C4A882", marginTop: "0.4rem" }}>
                    Paylaşılan pano
                  </p>
                )}
              </div>
            </Link>
            {isOwner && (
              <button
                onClick={() => handleDelete(board.id, board.title)}
                disabled={deletingId === board.id || isPending}
                style={{
                  position: "absolute",
                  bottom: 8,
                  right: 10,
                  background: "transparent",
                  border: "none",
                  color: "#C4A882",
                  fontSize: "1rem",
                  cursor: "pointer",
                  padding: "2px 4px",
                  fontFamily: "inherit",
                  lineHeight: 1,
                }}
                title="Sil"
              >
                ✕
              </button>
            )}
          </div>
        )
      })}
      <NewBoardForm />

      {confirmTarget && (
        <ConfirmDialog
          message={`"${confirmTarget.title}" panosunu silmek istediğine emin misin?`}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
    </div>
  )
}
