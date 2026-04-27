"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateKeyBetween } from "fractional-indexing"
import { updateTag } from "next/cache"
import { redirect } from "next/navigation"
import { requireBoardAccess } from "@/lib/board-access"

export async function createCard(columnId: string, title: string) {
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

  const last = await prisma.card.findFirst({
    where: { columnId },
    orderBy: { position: "desc" },
    select: { position: true },
  })

  const position = generateKeyBetween(last?.position ?? null, null)

  await prisma.card.create({
    data: { title: trimmed, position, columnId },
  })

  updateTag(`board-${column.boardId}`)
}

export async function updateCard(
  cardId: string,
  data: { title?: string; description?: string | null; dueDate?: Date | null }
) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    select: { column: { select: { boardId: true } } },
  })
  if (!card) return { error: "Bulunamadı" }

  const access = await requireBoardAccess(card.column.boardId, session.user.id)
  if (!access) return { error: "Erişim reddedildi" }

  const updateData: typeof data = {}
  if (data.title !== undefined) updateData.title = data.title.trim()
  if (data.description !== undefined) updateData.description = data.description
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate

  await prisma.card.update({ where: { id: cardId }, data: updateData })
  updateTag(`board-${card.column.boardId}`)
}

export async function deleteCard(cardId: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    select: { column: { select: { boardId: true } } },
  })
  if (!card) return { error: "Bulunamadı" }

  const access = await requireBoardAccess(card.column.boardId, session.user.id)
  if (!access) return { error: "Erişim reddedildi" }

  await prisma.card.delete({ where: { id: cardId } })
  updateTag(`board-${card.column.boardId}`)
}

export async function moveCard(
  cardId: string,
  toColumnId: string,
  prevPosition: string | null,
  nextPosition: string | null
) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    select: { column: { select: { boardId: true } } },
  })
  if (!card) return { error: "Bulunamadı" }

  const access = await requireBoardAccess(card.column.boardId, session.user.id)
  if (!access) return { error: "Erişim reddedildi" }

  const targetColumn = await prisma.column.findUnique({
    where: { id: toColumnId },
    select: { boardId: true },
  })
  if (!targetColumn || targetColumn.boardId !== card.column.boardId)
    return { error: "Bulunamadı" }

  const position = generateKeyBetween(prevPosition, nextPosition)

  await prisma.card.update({
    where: { id: cardId },
    data: { position, columnId: toColumnId },
  })

  updateTag(`board-${card.column.boardId}`)
}
