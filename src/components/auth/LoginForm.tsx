"use client"

import { useActionState } from "react"
import { useSearchParams } from "next/navigation"
import { loginAction } from "@/app/actions/auth"
import Link from "next/link"

const initialState = { error: {} }

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState)
  const searchParams = useSearchParams()
  const next = searchParams.get("next") ?? undefined

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {next && <input type="hidden" name="next" value={next} />}
      <div>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#2C1810", marginBottom: "0.25rem" }}>
          Tekrar hoş geldin
        </h1>
        <p style={{ color: "#8A6A58", fontSize: "1rem" }}>
          Devam etmek için giriş yap
        </p>
      </div>

      <div className="flex flex-col gap-5">
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
          <input id="password" name="password" type="password" required className="ink-input" placeholder="••••••••" />
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
          {isPending ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>
        <p style={{ textAlign: "center", color: "#8A6A58", fontSize: "0.95rem" }}>
          Hesabın yok mu?{" "}
          <Link href="/signup" style={{ color: "#2C1810", textDecoration: "underline" }}>
            Kayıt ol
          </Link>
        </p>
      </div>
    </form>
  )
}
