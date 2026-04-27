"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"

const POLL_INTERVAL = 3000
// After a local mutation, ignore version changes for this long so the user
// doesn't get a redundant refresh from their own action.
const MUTATION_COOLDOWN = 5000

export function useBoardSync(boardId: string, isDraggingRef: React.RefObject<boolean>) {
  const router = useRouter()
  const knownVersionRef = useRef<string | null>(null)
  const cooldownUntilRef = useRef(0)

  // Call after any local mutation to suppress the next poll-triggered refresh.
  function notifyMutated() {
    cooldownUntilRef.current = Date.now() + MUTATION_COOLDOWN
  }

  useEffect(() => {
    let cancelled = false

    async function poll() {
      if (cancelled) return
      if (isDraggingRef.current) return
      if (Date.now() < cooldownUntilRef.current) return

      try {
        const res = await fetch(`/api/boards/${boardId}/version`, { cache: "no-store" })
        if (!res.ok || cancelled) return
        const { version } = await res.json()

        if (knownVersionRef.current === null) {
          knownVersionRef.current = version
        } else if (version !== knownVersionRef.current) {
          knownVersionRef.current = version
          router.refresh()
        }
      } catch {
        // ignore transient network errors
      }
    }

    const id = setInterval(poll, POLL_INTERVAL)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [boardId, router, isDraggingRef])

  return { notifyMutated }
}
