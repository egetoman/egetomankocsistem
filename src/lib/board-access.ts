import { prisma } from "@/lib/prisma"

export type BoardRole = "owner" | "member"

export async function requireBoardAccess(
  boardId: string,
  userId: string
): Promise<{ role: BoardRole; ownerId: string } | null> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: {
      userId: true,
      members: { where: { userId }, select: { role: true } },
    },
  })
  if (!board) return null
  if (board.userId === userId) return { role: "owner", ownerId: board.userId }
  if (board.members.length > 0) return { role: "member", ownerId: board.userId }
  return null
}
