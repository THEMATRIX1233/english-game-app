import { useState, useCallback, useEffect, useRef } from 'react'

const STORAGE_KEY = 'english-game-state'

const defaultState = {
  phase: 'menu',
  blueScore: 0,
  redScore: 0,
  round: 1,
  currentTeam: 'blue',
  currentChallenge: null,
  challengeData: null,
  modo: null,
  totalRounds: 6,
  showWinner: false,
}

export function useGameSync(isTeacher) {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? { ...defaultState, ...JSON.parse(saved) } : defaultState
    } catch {
      return defaultState
    }
  })
  const prevRef = useRef(state)

  const updateState = useCallback((updates) => {
    setState(prev => {
      const next = { ...prev, ...updates }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const resetState = useCallback(() => {
    setState(defaultState)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState)) } catch {}
  }, [])

  useEffect(() => {
    if (!isTeacher) {
      const handler = () => {
        try {
          const saved = localStorage.getItem(STORAGE_KEY)
          if (saved) {
            const parsed = JSON.parse(saved)
            setState(prev => {
              if (JSON.stringify(prev) !== saved) return parsed
              return prev
            })
          }
        } catch {}
      }
      window.addEventListener('storage', handler)
      const interval = setInterval(handler, 500)
      return () => {
        window.removeEventListener('storage', handler)
        clearInterval(interval)
      }
    }
  }, [isTeacher])

  return { state, updateState, resetState }
}
