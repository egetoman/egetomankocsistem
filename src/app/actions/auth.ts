"use server"

import { AuthError } from "next-auth"
import bcrypt from "bcryptjs"
import { signIn } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { signupSchema, loginSchema } from "@/lib/schemas"

type AuthActionState = {
  error?: {
    name?: string[]
    email?: string[]
    password?: string[]
    _form?: string[]
  }
}

export async function signupAction(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { email, password, name } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: { email: ["Bu email zaten kayıtlı"] } }
  }

  const passwordHash = await bcrypt.hash(password, 10)
  await prisma.user.create({ data: { email, passwordHash, name } })

  try {
    await signIn("credentials", { email, password, redirectTo: "/boards" })
    return {}
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: { _form: ["Hesap oluşturuldu ama giriş yapılamadı, lütfen giriş sayfasından deneyin"] } }
    }
    throw error
  }
}

export async function loginAction(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const next = formData.get("next")
  const redirectTo =
    typeof next === "string" && next.startsWith("/") ? next : "/boards"

  try {
    await signIn("credentials", { ...parsed.data, redirectTo })
    return {}
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: { _form: ["Email veya şifre hatalı"] } }
    }
    throw error
  }
}
