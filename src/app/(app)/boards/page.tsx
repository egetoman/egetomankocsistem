import { Suspense } from "react"
import { auth, signOut } from "@/lib/auth"
import { connection } from "next/server"
import { prisma } from "@/lib/prisma"
import { cacheTag, cacheLife } from "next/cache"
import { BoardGrid } from "@/components/Board/BoardGrid"

export const unstable_instant = false

const VOWEL_SUFFIX: Record<string, string> = {
  a: "nın", ı: "nın",
  e: "nin", i: "nin",
  o: "nun", u: "nun",
  ö: "nün", ü: "nün",
}

function genitifEki(name: string): string {
  const lower = name.toLowerCase()
  for (let i = lower.length - 1; i >= 0; i--) {
    const suffix = VOWEL_SUFFIX[lower[i]]
    if (suffix) return `'${suffix}`
  }
  return "'nin"
}

async function UserBoardsLoader({ userId }: { userId: string }) {
  "use cache"
  cacheTag(`user-boards-${userId}`)
  cacheLife("hours")

  const boards = await prisma.board.findMany({
    where: {
      OR: [{ userId }, { members: { some: { userId } } }],
    },
    orderBy: { position: "asc" },
    select: {
      id: true,
      title: true,
      userId: true,
      createdAt: true,
      _count: { select: { columns: true } },
    },
  })

  return <BoardGrid boards={boards} currentUserId={userId} />
}

function BoardsSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.5rem" }}>
      {[1, 2, 3].map((i) => (
        <div key={i} className="paper-column" style={{ height: 120, opacity: 0.5, transform: `rotate(${i % 2 === 0 ? "0.6" : "-0.4"}deg)` }} />
      ))}
    </div>
  )
}

export default async function BoardsPage() {
  await connection()
  const session = await auth()
  if (!session?.user?.id) return null

  const displayName = session.user.name ?? session.user.email ?? ""

  return (
    <main className="flex-1 cork-texture min-h-screen p-8">
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: "2rem",
        }}
      >
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            color: "#FFF9EF",
            textShadow: "1px 2px 4px rgba(44,24,16,0.35)",
            margin: 0,
          }}
        >
          {`${displayName}${genitifEki(displayName)} panoları`}
        </h1>
        <form
          action={async () => {
            "use server"
            await signOut({ redirectTo: "/login" })
          }}
        >
          <button
            type="submit"
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255,249,239,0.6)",
              fontFamily: "inherit",
              fontSize: "1rem",
              cursor: "pointer",
              textDecoration: "underline",
              padding: 0,
            }}
          >
            Çıkış
          </button>
        </form>
      </div>

      <Suspense fallback={<BoardsSkeleton />}>
        <UserBoardsLoader userId={session.user.id} />
      </Suspense>
    </main>
  )
}
