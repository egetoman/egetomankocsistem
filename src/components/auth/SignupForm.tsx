"use client"

import { useActionState } from "react"
import { signupAction } from "@/app/actions/auth"
import Link from "next/link"

const initialState = { error: {} }

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signupAction, initialState)

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#2C1810", marginBottom: "0.25rem" }}>
          Hesap oluştur
        </h1>
        <p style={{ color: "#8A6A58", fontSize: "1rem" }}>
          TaskFlow&apos;a katıl
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <div>
          <label htmlFor="name" style={{ display: "block", color: "#8A6A58", fontSize: "0.95rem", marginBottom: "4px" }}>
            İsim (opsiyonel)
          </label>
          <input id="name" name="name" type="text" className="ink-input" placeholder="Adın Soyadın" />
          {state?.error?.name?.[0] && (
            <p style={{ color: "#C0392B", fontSize: "0.9rem", marginTop: "4px" }}>{state.error.name[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" style={{ display: "block", color: "#8A6A58", fontSize: "0.95rem", marginBottom: "4px" }}>
            Email
          </label>
          <input id="email" name="email" type="email" required className="ink-input" placeholder="sen@örnek.com" />
          {state?.error?.email?.[0] && (
            <p style={{ color: "#C0392B", fontSize: "0.9rem", marginTop: "4px" }}>{state.error.email[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" style={{ display: "block", color: "#8A6A58", fontSize: "0.95rem", marginBottom: "4px" }}>
            Şifre
          </label>
          <input id="password" name="password" type="password" required className="ink-input" placeholder="En az 8 karakter" />
          {state?.error?.password?.[0] && (
            <p style={{ color: "#C0392B", fontSize: "0.9rem", marginTop: "4px" }}>{state.error.password[0]}</p>
          )}
        </div>

        {state?.error?._form?.[0] && (
          <p style={{ color: "#C0392B", fontSize: "0.95rem" }}>{state.error._form[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <button type="submit" disabled={isPending} className="stamp-btn">
          {isPending ? "Hesap oluşturuluyor..." : "Hesap Oluştur"}
        </button>
        <p style={{ textAlign: "center", color: "#8A6A58", fontSize: "0.95rem" }}>
          Zaten hesabın var mı?{" "}
          <Link href="/login" style={{ color: "#2C1810", textDecoration: "underline" }}>
            Giriş yap
          </Link>
        </p>
      </div>
    </form>
  )
}
