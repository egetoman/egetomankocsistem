"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { updateTag } from "next/cache"
import { redirect } from "next/navigation"
import { requireBoardAccess } from "@/lib/board-access"

export async function inviteToBoard(boardId: string, email: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const trimmed = email.trim().toLowerCase()
  if (!trimmed || !trimmed.includes("@")) return { error: "Geçerli bir e-posta girin" }

  // Any member (owner or member) can invite
  const access = await requireBoardAccess(boardId, session.user.id)
  if (!access) return { error: "Erişim reddedildi" }

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { id: true, title: true },
  })
  if (!board) return { error: "Pano bulunamadı" }

  // Don't invite yourself
  if (trimmed === session.user.email?.toLowerCase()) return { error: "Kendinizi davet edemezsiniz" }

  // Check if already a member
  const targetUser = await prisma.user.findUnique({
    where: { email: trimmed },
    select: { id: true },
  })
  if (targetUser) {
    const existing = await prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId: targetUser.id } },
    })
    if (existing) return { error: "Bu kullanıcı zaten üye" }
  }

  // Check for existing pending invite
  const existingInvite = await prisma.invitation.findFirst({
    where: { boardId, email: trimmed, acceptedAt: null, expiresAt: { gt: new Date() } },
  })
  if (existingInvite) return { error: "Bu e-postaya zaten davet gönderildi" }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const invitation = await prisma.invitation.create({
    data: { boardId, email: trimmed, invitedById: session.user.id, expiresAt },
  })

  // Prefer explicit auth URL, then Vercel preview/prod URL, then local fallback.
  const vercelUrl = process.env.VERCEL_URL
  const inferredVercelBaseUrl = vercelUrl ? `https://${vercelUrl}` : undefined
  const baseUrl =
    process.env.NEXTAUTH_URL ??
    process.env.AUTH_URL ??
    inferredVercelBaseUrl ??
    "http://localhost:3000"
  console.log(`[Invite] ${session.user.email} → ${trimmed}: ${baseUrl}/invite/${invitation.token}`)

  updateTag(`board-${boardId}`)

  // Invalidate the recipient's inbox if they're already a user
  if (targetUser) updateTag(`user-invitations-${targetUser.id}`)

  return { token: invitation.token }
}

export async function revokeInvitation(invitationId: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    select: { boardId: true, board: { select: { userId: true } } },
  })
  if (!invitation || invitation.board.userId !== session.user.id)
    return { error: "Erişim reddedildi" }

  await prisma.invitation.delete({ where: { id: invitationId } })
  updateTag(`board-${invitation.boardId}`)
}

export async function removeMember(boardId: string, memberId: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const board = await prisma.board.findUnique({
    where: { id: boardId, userId: session.user.id },
    select: { id: true },
  })
  if (!board) return { error: "Erişim reddedildi" }

  await prisma.boardMember.deleteMany({
    where: { boardId, userId: memberId },
  })
  updateTag(`board-${boardId}`)
  updateTag(`user-boards-${memberId}`)
}

export async function acceptInvitation(token: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    select: { id: true, boardId: true, email: true, expiresAt: true, acceptedAt: true },
  })

  if (!invitation) return { error: "Davet bulunamadı" }
  if (invitation.acceptedAt) return { error: "Bu davet zaten kabul edildi" }
  if (invitation.expiresAt < new Date()) return { error: "Bu davetin süresi doldu" }
  if (invitation.email !== session.user.email?.toLowerCase())
    return { error: "Bu davet sizin için değil" }

  // Check already a member
  const existing = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId: invitation.boardId, userId: session.user.id } },
  })

  if (!existing) {
    await prisma.boardMember.create({
      data: { boardId: invitation.boardId, userId: session.user.id, role: "MEMBER" },
    })
  }

  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { acceptedAt: new Date() },
  })

  updateTag(`user-boards-${session.user.id}`)
  updateTag(`board-${invitation.boardId}`)
  updateTag(`user-invitations-${session.user.id}`)

  redirect(`/boards/${invitation.boardId}`)
}

export async function declineInvitation(token: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    select: { id: true, email: true },
  })
  if (!invitation || invitation.email !== session.user.email?.toLowerCase())
    return { error: "Bulunamadı" }

  await prisma.invitation.delete({ where: { id: invitation.id } })
  updateTag(`user-invitations-${session.user.id}`)
}
