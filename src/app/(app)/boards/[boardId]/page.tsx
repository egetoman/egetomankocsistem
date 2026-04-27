import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { connection } from "next/server"
import { prisma } from "@/lib/prisma"
import { cacheTag, cacheLife } from "next/cache"
import { notFound } from "next/navigation"
import { KanbanBoard } from "@/components/Board/KanbanBoard"

export const unstable_instant = false

async function BoardDataLoader({ boardId, userId }: { boardId: string; userId: string }) {
  "use cache"
  cacheTag(`board-${boardId}`)
  cacheLife("hours")

  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      OR: [{ userId }, { members: { some: { userId } } }],
    },
    include: {
      columns: {
        orderBy: { position: "asc" },
        include: {
          cards: { orderBy: { position: "asc" } },
        },
      },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      invitations: {
        where: { acceptedAt: null, expiresAt: { gt: new Date() } },
        select: { id: true, email: true, token: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!board) notFound()

  const lastUpdated = board.columns
    .flatMap((c) => c.cards)
    .reduce((max, card) => Math.max(max, card.updatedAt.getTime()), 0)

  const itemKey =
    board.columns.length +
    "-" +
    board.columns.reduce((sum, c) => sum + c.cards.length, 0) +
    "-" +
    lastUpdated

  const isOwner = board.userId === userId

  return (
    <KanbanBoard
      key={itemKey}
      board={board}
      isOwner={isOwner}
      members={board.members}
      pendingInvitations={board.invitations}
    />
  )
}

function BoardSkeleton() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "10px 24px", background: "rgba(44,24,16,0.3)", height: 44 }} />
      <div style={{ flex: 1, display: "flex", gap: 18, padding: 24, alignItems: "flex-start" }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="paper-column"
            style={{ flexShrink: 0, width: 280, height: 320, opacity: 0.4 + i * 0.1 }}
          />
        ))}
      </div>
    </div>
  )
}

export default async function BoardPage({
  params,
}: {
  params: Promise<{ boardId: string }>
}) {
  await connection()
  const { boardId } = await params
  const session = await auth()
  if (!session?.user?.id) return null

  return (
    <main className="flex-1 cork-texture overflow-x-auto min-h-screen">
      <Suspense fallback={<BoardSkeleton />}>
        <BoardDataLoader boardId={boardId} userId={session.user.id} />
      </Suspense>
    </main>
  )
}
