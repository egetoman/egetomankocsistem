"use client"

import { useState, useTransition, useEffect } from "react"
import { toast } from "sonner"
import { inviteToBoard, revokeInvitation, removeMember } from "@/lib/actions/invitations"

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

type Props = {
  boardId: string
  boardTitle: string
  isOwner: boolean
  members: Member[]
  pendingInvitations: PendingInvite[]
  onClose: () => void
}

export function ShareModal({ boardId, boardTitle, isOwner, members, pendingInvitations, onClose }: Props) {
  const [email, setEmail] = useState("")
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isRevoking, startRevoking] = useTransition()
  const [isRemoving, startRemoving] = useTransition()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""

  function handleInvite() {
    if (!email.trim()) return
    startTransition(async () => {
      const res = await inviteToBoard(boardId, email)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success("Davet oluşturuldu")
        setEmail("")
        if (res?.token) {
          const link = `${baseUrl}/invite/${res.token}`
          navigator.clipboard.writeText(link).catch(() => {})
          toast.success("Davet linki panoya kopyalandı")
        }
      }
    })
  }

  function copyLink(token: string) {
    const link = `${baseUrl}/invite/${token}`
    navigator.clipboard.writeText(link).then(() => {
      setCopiedToken(token)
      setTimeout(() => setCopiedToken(null), 2000)
    })
  }

  function handleRevoke(invitationId: string) {
    startRevoking(async () => {
      await revokeInvitation(invitationId)
      toast.success("Davet iptal edildi")
    })
  }

  function handleRemove(memberId: string, memberName: string) {
    startRemoving(async () => {
      await removeMember(boardId, memberId)
      toast.success(`${memberName} panoda kaldırıldı`)
    })
  }

  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 0",
    borderBottom: "1px solid rgba(196,168,130,0.2)",
  }

  const labelStyle: React.CSSProperties = {
    flex: 1,
    fontSize: "1rem",
    color: "#2C1810",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }

  const badgeStyle: React.CSSProperties = {
    fontSize: "0.78rem",
    color: "#8A6A58",
    background: "rgba(196,168,130,0.2)",
    padding: "2px 6px",
    flexShrink: 0,
  }

  const ghostBtnStyle: React.CSSProperties = {
    background: "transparent",
    border: "none",
    color: "#C4A882",
    cursor: "pointer",
    fontSize: "0.85rem",
    padding: "2px 6px",
    fontFamily: "inherit",
    flexShrink: 0,
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
          maxWidth: 480,
          padding: "2rem",
          transform: "rotate(-0.3deg)",
          position: "relative",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 12,
            right: 14,
            background: "transparent",
            border: "none",
            fontSize: "1.2rem",
            color: "#8A6A58",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          ✕
        </button>

        <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#2C1810", marginBottom: "0.25rem" }}>
          Panoyu paylaş
        </h2>
        <p style={{ fontSize: "0.9rem", color: "#8A6A58", marginBottom: "1.5rem" }}>
          {boardTitle}
        </p>

        {/* Invite form */}
        <div style={{ display: "flex", gap: 8, marginBottom: "1.75rem" }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleInvite() }}
            placeholder="E-posta adresi"
            className="ink-input"
            style={{ flex: 1, fontSize: "1rem" }}
            disabled={isPending}
            type="email"
          />
          <button
            onClick={handleInvite}
            disabled={isPending || !email.trim()}
            className="stamp-btn"
            style={{ whiteSpace: "nowrap" }}
          >
            {isPending ? "..." : "Davet et"}
          </button>
        </div>

        {/* Members */}
        {members.length > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <p style={{ fontSize: "0.82rem", color: "#C4A882", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Üyeler
            </p>
            {members.map((m) => (
              <div key={m.id} style={rowStyle}>
                <span style={labelStyle}>
                  {m.user.name ?? m.user.email}
                  {m.user.name && (
                    <span style={{ fontSize: "0.85rem", color: "#8A6A58", marginLeft: 4 }}>
                      {m.user.email}
                    </span>
                  )}
                </span>
                <span style={badgeStyle}>{m.role === "OWNER" ? "Sahip" : "Üye"}</span>
                {isOwner && m.role !== "OWNER" && (
                  <button
                    onClick={() => handleRemove(m.user.id, m.user.name ?? m.user.email)}
                    disabled={isRemoving}
                    style={ghostBtnStyle}
                    title="Üyeyi kaldır"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pending invitations */}
        {pendingInvitations.length > 0 && (
          <div>
            <p style={{ fontSize: "0.82rem", color: "#C4A882", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Bekleyen davetler
            </p>
            {pendingInvitations.map((inv) => (
              <div key={inv.id} style={rowStyle}>
                <span style={labelStyle}>{inv.email}</span>
                <button
                  onClick={() => copyLink(inv.token)}
                  style={{ ...ghostBtnStyle, color: copiedToken === inv.token ? "#7BAE7F" : "#8A6A58", fontSize: "0.82rem" }}
                  title="Linki kopyala"
                >
                  {copiedToken === inv.token ? "Kopyalandı ✓" : "Linki kopyala"}
                </button>
                <button
                  onClick={() => handleRevoke(inv.id)}
                  disabled={isRevoking}
                  style={ghostBtnStyle}
                  title="İptal et"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {members.length === 0 && pendingInvitations.length === 0 && (
          <p style={{ color: "#C4A882", fontSize: "0.95rem", textAlign: "center", padding: "1rem 0" }}>
            Henüz kimseyle paylaşılmadı
          </p>
        )}
      </div>
    </div>
  )
}
