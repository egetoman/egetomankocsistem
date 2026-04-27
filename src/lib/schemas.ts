import { z } from "zod"

export const signupSchema = z.object({
  email: z.string().email("Geçerli bir email girin"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı"),
  name: z.string().min(2, "İsim en az 2 karakter olmalı").optional(),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
