import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { connection } from "next/server"
import { acceptInvitation } from "@/lib/actions/invitations"

async function InviteContent({ params }: { params: Promise<{ token: string }> }) {
  await connection()
  const { token } = await params

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    select: {
      id: true,
      email: true,
      expiresAt: true,
      acceptedAt: true,
      board: { select: { title: true } },
      invitedBy: { select: { name: true, email: true } },
    },
  })

  const session = await auth()

  const outerStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "radial-gradient(ellipse at 30% 20%, #C4956A 0%, #B09270 40%, #8B7355 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    fontFamily: "var(--font-hand), cursive",
  }

  const cardStyle: React.CSSProperties = {
    background: "#FFF9EF",
    boxShadow: "3px 6px 18px rgba(44,24,16,0.22), 0 0 0 1px rgba(44,24,16,0.06)",
    padding: "2.5rem 2rem",
    maxWidth: 420,
    width: "100%",
    transform: "rotate(-0.4deg)",
    position: "relative",
  }

  if (!invitation || invitation.expiresAt < new Date()) {
    return (
      <div style={outerStyle}>
        <div style={cardStyle}>
          <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✉️</p>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#2C1810", marginBottom: "0.75rem" }}>
            Davet bulunamadı
          </h1>
          <p style={{ color: "#8A6A58", fontSize: "1.05rem" }}>
            Bu davet linki geçersiz ya da süresi dolmuş.
          </p>
          <a href="/boards" style={{ display: "inline-block", marginTop: "1.5rem", color: "#8A6A58", fontSize: "0.95rem" }}>
            ← Panolarıma dön
          </a>
        </div>
      </div>
    )
  }

  if (invitation.acceptedAt) {
    return (
      <div style={outerStyle}>
        <div style={cardStyle}>
          <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✓</p>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#2C1810", marginBottom: "0.75rem" }}>
            Davet zaten kabul edildi
          </h1>
          <p style={{ color: "#8A6A58", fontSize: "1.05rem" }}>Bu davet daha önce kabul edildi.</p>
          <a href="/boards" style={{ display: "inline-block", marginTop: "1.5rem", color: "#8A6A58", fontSize: "0.95rem" }}>
            ← Panolarıma dön
          </a>
        </div>
      </div>
    )
  }

  const inviterName = invitation.invitedBy.name ?? invitation.invitedBy.email

  if (!session?.user) {
    return (
      <div style={outerStyle}>
        <div style={cardStyle}>
          <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✉️</p>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#2C1810", marginBottom: "0.5rem" }}>
            Davet aldınız
          </h1>
          <p style={{ color: "#8A6A58", fontSize: "1.05rem", marginBottom: "1.5rem" }}>
            <strong style={{ color: "#2C1810" }}>{inviterName}</strong> sizi{" "}
            <strong style={{ color: "#2C1810" }}>{invitation.board.title}</strong> panosuna davet etti.
          </p>
          <a
            href={`/login?next=/invite/${token}`}
            style={{
              display: "block",
              background: "#2C1810",
              color: "#FFF9EF",
              textAlign: "center",
              padding: "12px 24px",
              fontFamily: "inherit",
              fontSize: "1.1rem",
              fontWeight: 700,
              textDecoration: "none",
              letterSpacing: "0.03em",
            }}
          >
            Giriş yap ve kabul et
          </a>
        </div>
      </div>
    )
  }

  const emailMismatch = invitation.email !== session.user.email?.toLowerCase()

  return (
    <div style={outerStyle}>
      <div style={cardStyle}>
        <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✉️</p>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#2C1810", marginBottom: "0.5rem" }}>
          Panoya davet
        </h1>
        <p style={{ color: "#8A6A58", fontSize: "1.05rem", marginBottom: "1.5rem" }}>
          <strong style={{ color: "#2C1810" }}>{inviterName}</strong> sizi{" "}
          <strong style={{ color: "#2C1810" }}>{invitation.board.title}</strong> panosuna davet etti.
        </p>
        {emailMismatch ? (
          <div style={{ background: "rgba(216,100,80,0.1)", border: "1px solid rgba(216,100,80,0.3)", padding: "12px 16px", color: "#8A4030", fontSize: "0.95rem" }}>
            Bu davet <strong>{invitation.email}</strong> adresine gönderildi. Şu an{" "}
            <strong>{session.user.email}</strong> ile giriş yaptınız.
          </div>
        ) : (
          <form action={async () => { "use server"; await acceptInvitation(token) }}>
            <button
              type="submit"
              style={{
                width: "100%",
                background: "#2C1810",
                color: "#FFF9EF",
                border: "none",
                padding: "12px 24px",
                fontFamily: "inherit",
                fontSize: "1.1rem",
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "0.03em",
              }}
            >
              Daveti kabul et
            </button>
          </form>
        )}
        <a href="/boards" style={{ display: "inline-block", marginTop: "1rem", color: "#8A6A58", fontSize: "0.9rem" }}>
          ← Panolarıma dön
        </a>
      </div>
    </div>
  )
}

export default function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  return (
    <Suspense>
      <InviteContent params={params} />
    </Suspense>
  )
}
