import { useTimer } from '../hooks/useTimer'

export default function Timer({ initialTime = 30, onEnd, onTimeUpdate }) {
  const { timeLeft, isRunning, start, stop } = useTimer(initialTime)

  const handleStart = () => {
    start(initialTime, onEnd)
  }

  const percentage = (timeLeft / initialTime) * 100
  const isLow = timeLeft <= 10
  const isCritical = timeLeft <= 5

  const circleStyle = {
    strokeDasharray: `${2 * Math.PI * 54}`,
    strokeDashoffset: `${2 * Math.PI * 54 * (1 - percentage / 100)}`,
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-white/10"
          />
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            style={circleStyle}
            className={`transition-all duration-1000 ease-linear ${
              isCritical ? 'text-red-500' : isLow ? 'text-yellow-400' : 'text-emerald-400'
            }`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-3xl font-bold tabular-nums ${
            isCritical ? 'text-red-500 animate-pulse' : isLow ? 'text-yellow-400' : 'text-white'
          }`}>
            {timeLeft}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        {!isRunning ? (
          <button onClick={handleStart} className="btn-primary text-sm py-2 px-4">
            Start Timer
          </button>
        ) : (
          <button onClick={stop} className="btn-ghost text-sm py-2 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400">
            Stop
          </button>
        )}
      </div>
    </div>
  )
}
