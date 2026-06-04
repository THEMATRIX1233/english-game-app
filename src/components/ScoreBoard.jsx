export default function ScoreBoard({ blueScore, redScore, round }) {
  const total = blueScore + redScore || 1
  const bluePercent = (blueScore / total) * 100
  const redPercent = (redScore / total) * 100

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
          <span className="font-bold text-blue-400 text-lg">Team Blue</span>
        </div>
        <div className="text-center">
          <span className="text-xs uppercase tracking-widest text-white/40">Round</span>
          <div className="text-2xl font-bold text-white">{round}</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bold text-red-400 text-lg">Team Red</span>
          <div className="w-4 h-4 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
        </div>
      </div>

      <div className="relative h-16 glass rounded-2xl overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600/80 to-blue-500/60 transition-all duration-700 ease-out"
          style={{ width: `${bluePercent}%` }}
        />
        <div
          className="absolute inset-y-0 right-0 bg-gradient-to-l from-red-600/80 to-red-500/60 transition-all duration-700 ease-out"
          style={{ width: `${redPercent}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-between px-6">
          <span className="text-3xl font-black text-white drop-shadow-lg">{blueScore}</span>
          <span className="text-3xl font-black text-white drop-shadow-lg">{redScore}</span>
        </div>
      </div>
    </div>
  )
}
