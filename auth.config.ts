import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const pathname = request.nextUrl.pathname
      const isLoggedIn = !!auth?.user
      const isOnAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup")

      if (isOnAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/boards", request.nextUrl))
      }
      if (!isOnAuthPage && !isLoggedIn) {
        return false
      }
      return true
    },
  },
} satisfies NextAuthConfig
