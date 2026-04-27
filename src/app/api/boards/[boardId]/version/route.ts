import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireBoardAccess } from "@/lib/board-access"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id)
    return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { boardId } = await params

  const access = await requireBoardAccess(boardId, session.user.id)
  if (!access) return Response.json({ error: "Not found" }, { status: 404 })

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: {
      columns: {
        select: {
          id: true,
          cards: { select: { updatedAt: true } },
        },
      },
    },
  })

  if (!board) return Response.json({ error: "Not found" }, { status: 404 })

  const colCount = board.columns.length
  const cards = board.columns.flatMap((c) => c.cards)
  const cardCount = cards.length
  const lastUpdated = cards.reduce(
    (max, card) => Math.max(max, card.updatedAt.getTime()),
    0
  )

  return Response.json({ version: `${colCount}-${cardCount}-${lastUpdated}` })
}
