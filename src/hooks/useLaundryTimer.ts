import { useState, useEffect, useRef, useCallback } from 'react'

export interface ActiveTimer {
  sessionId: string
  programName: string
  totalSeconds: number
  secondsLeft: number
  endsAt: Date
  completed: boolean
}

export function useLaundryTimer() {
  const [timers, setTimers] = useState<ActiveTimer[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const tick = useCallback(() => {
    const now = Date.now()
    setTimers(prev => prev.map(t => {
      if (t.completed) return t
      const left = Math.max(0, Math.round((t.endsAt.getTime() - now) / 1000))
      return { ...t, secondsLeft: left, completed: left === 0 }
    }))
  }, [])

  useEffect(() => {
    intervalRef.current = setInterval(tick, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [tick])

  const addTimer = useCallback((sessionId: string, programName: string, endsAt: Date) => {
    const now = Date.now()
    const totalSeconds = Math.round((endsAt.getTime() - now) / 1000)
    const secondsLeft = Math.max(0, totalSeconds)
    setTimers(prev => [...prev.filter(t => t.sessionId !== sessionId), {
      sessionId, programName, totalSeconds, secondsLeft, endsAt, completed: secondsLeft === 0,
    }])
  }, [])

  const removeTimer = useCallback((sessionId: string) => {
    setTimers(prev => prev.filter(t => t.sessionId !== sessionId))
  }, [])

  return { timers, addTimer, removeTimer }
}
