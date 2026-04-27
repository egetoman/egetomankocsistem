"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateKeyBetween } from "fractional-indexing"
import { updateTag } from "next/cache"
import { redirect } from "next/navigation"
import { requireBoardAccess } from "@/lib/board-access"

export async function createColumn(boardId: string, title: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const trimmed = title.trim()
  if (!trimmed) return { error: "Başlık gerekli" }

  const access = await requireBoardAccess(boardId, session.user.id)
  if (!access) return { error: "Erişim reddedildi" }

  const last = await prisma.column.findFirst({
    where: { boardId },
    orderBy: { position: "desc" },
    select: { position: true },
  })

  const position = generateKeyBetween(last?.position ?? null, null)

  await prisma.column.create({
    data: { title: trimmed, position, boardId },
  })

  updateTag(`board-${boardId}`)
}

export async function updateColumnTitle(columnId: string, title: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const trimmed = title.trim()
  if (!trimmed) return { error: "Başlık gerekli" }

  const column = await prisma.column.findUnique({
    where: { id: columnId },
    select: { boardId: true },
  })
  if (!column) return { error: "Bulunamadı" }

  const access = await requireBoardAccess(column.boardId, session.user.id)
  if (!access) return { error: "Erişim reddedildi" }

  await prisma.column.update({ where: { id: columnId }, data: { title: trimmed } })
  updateTag(`board-${column.boardId}`)
}

export async function reorderColumn(
  columnId: string,
  prevPosition: string | null,
  nextPosition: string | null
) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const column = await prisma.column.findUnique({
    where: { id: columnId },
    select: { boardId: true },
  })
  if (!column) return { error: "Bulunamadı" }

  const access = await requireBoardAccess(column.boardId, session.user.id)
  if (!access) return { error: "Erişim reddedildi" }

  const position = generateKeyBetween(prevPosition, nextPosition)
  await prisma.column.update({ where: { id: columnId }, data: { position } })
  updateTag(`board-${column.boardId}`)
}

export async function deleteColumn(columnId: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const column = await prisma.column.findUnique({
    where: { id: columnId },
    select: { boardId: true },
  })
  if (!column) return { error: "Bulunamadı" }

  const access = await requireBoardAccess(column.boardId, session.user.id)
  if (!access) return { error: "Erişim reddedildi" }

  await prisma.column.delete({ where: { id: columnId } })
  updateTag(`board-${column.boardId}`)
}
