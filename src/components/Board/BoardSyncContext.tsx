"use client"

import { createContext, useContext } from "react"

const BoardSyncContext = createContext<{ notifyMutated: () => void }>({
  notifyMutated: () => {},
})

export function useBoardSyncContext() {
  return useContext(BoardSyncContext)
}

export { BoardSyncContext }
