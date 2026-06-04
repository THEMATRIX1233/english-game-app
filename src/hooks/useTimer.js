import { useState, useEffect, useCallback, useRef } from 'react'

export function useTimer(initialTime = 30) {
  const [timeLeft, setTimeLeft] = useState(initialTime)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef(null)
  const callbackRef = useRef(null)

  const start = useCallback((time, onEnd) => {
    setTimeLeft(time ?? initialTime)
    setIsRunning(true)
    if (onEnd) callbackRef.current = onEnd
  }, [initialTime])

  const stop = useCallback(() => {
    setIsRunning(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    stop()
    setTimeLeft(initialTime)
  }, [initialTime, stop])

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false)
            if (callbackRef.current) {
              callbackRef.current()
              callbackRef.current = null
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning, timeLeft])

  return { timeLeft, isRunning, start, stop, reset, setTimeLeft }
}
