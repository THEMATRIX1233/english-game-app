import { useEffect, useState } from 'react'

export default function WinnerModal({ blueScore, redScore, onRestart }) {
  const [visible, setVisible] = useState(false)
  const blueWins = blueScore > redScore
  const redWins = redScore > blueScore
  const tie = blueScore === redScore

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
  }, [])

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-500 ${
      visible ? 'opacity-100' : 'opacity-0'
    }`}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className={`relative glass p-10 text-center max-w-lg mx-4 animate-bounce-in ${
        blueWins ? 'border-blue-500/50 team-blue-glow' :
        redWins ? 'border-red-500/50 team-red-glow' :
        'border-yellow-500/50'
      }`}>
        <div className="text-6xl mb-4">
          {tie ? '🤝' : '🏆'}
        </div>

        <h2 className={`text-4xl font-black mb-2 ${
          tie ? 'text-yellow-400' : blueWins ? 'text-blue-400' : 'text-red-400'
        }`}>
          {tie ? "IT'S A TIE!" : `${blueWins ? 'BLUE' : 'RED'} TEAM WINS!`}
        </h2>

        <p className="text-white/60 text-lg mb-6">
          {tie
            ? 'Both teams played amazingly!'
            : `Congratulations to the ${blueWins ? 'Blue' : 'Red'} Team!`}
        </p>

        <div className="flex items-center justify-center gap-8 mb-8">
          <div className="text-center">
            <div className="text-sm text-blue-400 font-semibold">BLUE</div>
            <div className={`text-5xl font-black ${blueWins ? 'text-blue-400' : 'text-white/40'}`}>
              {blueScore}
            </div>
          </div>
          <div className="text-3xl font-black text-white/30">VS</div>
          <div className="text-center">
            <div className="text-sm text-red-400 font-semibold">RED</div>
            <div className={`text-5xl font-black ${redWins ? 'text-red-400' : 'text-white/40'}`}>
              {redScore}
            </div>
          </div>
        </div>

        <button onClick={onRestart} className="btn-primary text-lg px-10">
          Play Again
        </button>
      </div>
    </div>
  )
}
