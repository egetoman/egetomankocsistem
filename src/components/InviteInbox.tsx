"use client"

import { useState, useTransition, useEffect, useRef } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { acceptInvitation, declineInvitation } from "@/lib/actions/invitations"

type Invite = {
  token: string
  boardTitle: string
  inviterName: string
  createdAt: Date
}

export function InviteInbox({ invitations }: { invitations: Invite[] }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  function handleAccept(token: string) {
    startTransition(async () => {
      await acceptInvitation(token)
      // acceptInvitation redirects, so nothing to do here
    })
  }

  function handleDecline(token: string) {
    startTransition(async () => {
      const res = await declineInvitation(token)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success("Davet reddedildi")
        router.refresh()
        setOpen(false)
      }
    })
  }

  const count = invitations.length

  return (
    <div
      ref={panelRef}
      style={{ position: "fixed", top: 10, right: 16, zIndex: 150 }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        title="Davetler"
        style={{
          background: "transparent",
          border: "none",
          width: 44,
          height: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          position: "relative",
          fontFamily: "inherit",
          padding: 0,
        }}
      >
        <Image src="/notification-bell.png" alt="Davetler" width={28} height={28} style={{ filter: "invert(1)", opacity: 0.85 }} />
        {count > 0 && (
          <span
            style={{
              position: "absolute",
              top: -5,
              right: -5,
              background: "#E85D5D",
              color: "#FFF9EF",
              fontSize: "0.7rem",
              fontWeight: 700,
              width: 17,
              height: 17,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            {count}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 320,
            background: "#FFF9EF",
            boxShadow: "3px 6px 20px rgba(44,24,16,0.25), 0 0 0 1px rgba(44,24,16,0.08)",
            zIndex: 200,
            fontFamily: "var(--font-hand), cursive",
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid rgba(196,168,130,0.3)",
              fontSize: "0.85rem",
              color: "#C4A882",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Bekleyen davetler
          </div>

          {count === 0 ? (
            <p
              style={{
                padding: "1.25rem 1rem",
                color: "#C4A882",
                fontSize: "0.95rem",
                textAlign: "center",
              }}
            >
              Bekleyen davet yok
            </p>
          ) : (
            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              {invitations.map((inv) => (
                <div
                  key={inv.token}
                  style={{
                    padding: "12px 14px",
                    borderBottom: "1px solid rgba(196,168,130,0.15)",
                  }}
                >
                  <p style={{ fontSize: "1rem", color: "#2C1810", fontWeight: 600, marginBottom: 2 }}>
                    {inv.boardTitle}
                  </p>
                  <p style={{ fontSize: "0.88rem", color: "#8A6A58", marginBottom: 10 }}>
                    {inv.inviterName} sizi davet etti
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => handleAccept(inv.token)}
                      disabled={isPending}
                      style={{
                        flex: 1,
                        background: "#2C1810",
                        color: "#FFF9EF",
                        border: "none",
                        padding: "7px 0",
                        fontFamily: "inherit",
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Kabul et
                    </button>
                    <button
                      onClick={() => handleDecline(inv.token)}
                      disabled={isPending}
                      style={{
                        flex: 1,
                        background: "transparent",
                        border: "1.5px solid rgba(44,24,16,0.2)",
                        color: "#8A6A58",
                        padding: "7px 0",
                        fontFamily: "inherit",
                        fontSize: "0.9rem",
                        cursor: "pointer",
                      }}
                    >
                      Reddet
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
