import { redirect } from "next/navigation"
import { connection } from "next/server"
import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { cacheTag, cacheLife } from "next/cache"
import { InviteInbox } from "@/components/InviteInbox"
import { AboutPanel } from "@/components/AboutPanel"

async function InviteInboxLoader({ userId, userEmail }: { userId: string; userEmail: string }) {
  "use cache"
  cacheTag(`user-invitations-${userId}`)
  cacheLife("minutes")

  const invitations = await prisma.invitation.findMany({
    where: {
      email: userEmail,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      token: true,
      createdAt: true,
      board: { select: { title: true } },
      invitedBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const mapped = invitations.map((inv) => ({
    token: inv.token,
    boardTitle: inv.board.title,
    inviterName: inv.invitedBy.name ?? inv.invitedBy.email,
    createdAt: inv.createdAt,
  }))

  return <InviteInbox invitations={mapped} />
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await connection()
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <div className="min-h-screen flex flex-col">
      {children}
      <Suspense>
        <InviteInboxLoader
          userId={session.user.id!}
          userEmail={session.user.email!.toLowerCase()}
        />
      </Suspense>
      <AboutPanel />
    </div>
  )
}
