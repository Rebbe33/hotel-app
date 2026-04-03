import { formatCountdown } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Props {
  secondsLeft: number
  totalSeconds: number
  programName: string
  size?: number
  onStop?: () => void
}

export function TimerRing({ secondsLeft, totalSeconds, programName, size = 140, onStop }: Props) {
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 0
  const dashOffset = circumference * (1 - progress)
  const urgent = secondsLeft <= 60 && secondsLeft > 0
  const done = secondsLeft === 0

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" strokeWidth="8"
            className="timer-ring-bg"
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1s linear' }}
            stroke={done ? '#8aab8a' : urgent ? '#c4704f' : '#6b8f6b'}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {done ? (
            <span className="text-2xl">✓</span>
          ) : (
            <>
              <span className={cn('font-display font-bold text-xl', urgent ? 'text-terracotta-500' : 'text-sage-700')}>
                {formatCountdown(secondsLeft)}
              </span>
              {urgent && <span className="text-[10px] text-terracotta-500 font-body font-semibold animate-pulse">Bientôt !</span>}
            </>
          )}
        </div>
      </div>
      <p className="text-sm font-body font-semibold text-gray-700 text-center">{programName}</p>
      {done && <p className="text-xs text-sage-600 font-body font-semibold">Programme terminé 🎉</p>}
      {onStop && (
        <button onClick={onStop} className="text-xs text-gray-400 font-body underline mt-1">
          Arrêter
        </button>
      )}
    </div>
  )
}
