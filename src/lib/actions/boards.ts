"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateKeyBetween } from "fractional-indexing"
import { updateTag } from "next/cache"
import { redirect } from "next/navigation"

export async function createBoard(title: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const trimmed = title.trim()
  if (!trimmed) return { error: "Başlık gerekli" }

  const last = await prisma.board.findFirst({
    where: { userId: session.user.id },
    orderBy: { position: "desc" },
    select: { position: true },
  })

  const position = generateKeyBetween(last?.position ?? null, null)

  await prisma.board.create({
    data: { title: trimmed, position, userId: session.user.id },
  })

  updateTag(`user-boards-${session.user.id}`)
}

export async function deleteBoard(boardId: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  await prisma.board.deleteMany({
    where: { id: boardId, userId: session.user.id },
  })

  updateTag(`user-boards-${session.user.id}`)
}

export async function updateBoardTitle(boardId: string, title: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const trimmed = title.trim()
  if (!trimmed) return { error: "Başlık gerekli" }

  await prisma.board.updateMany({
    where: { id: boardId, userId: session.user.id },
    data: { title: trimmed },
  })

  updateTag(`user-boards-${session.user.id}`)
}
