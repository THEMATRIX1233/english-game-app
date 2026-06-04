import { useState, useEffect, useRef } from 'react'
import { connect, disconnect } from '../socket'

const COLORS = ['#E74C3C', '#3498DB', '#F1C40F', '#2ECC71']
const TIMER_DURATION = 30

export default function GameView() {
  const [phase, setPhase] = useState('lobby')
  const [players, setPlayers] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION)
  const [answerCount, setAnswerCount] = useState(0)
  const [totalPlayers, setTotalPlayers] = useState(0)
  const [results, setResults] = useState(null)
  const [scores, setScores] = useState({})
  const [playerCount, setPlayerCount] = useState(0)
  const [fadeIn, setFadeIn] = useState(false)
  const audioRef = useRef(null)

  useEffect(() => {
    const s = connect()

    s.on('connect', () => s.emit('join-view', 'game'))

    s.on('game:players-update', (p) => {
      setPlayers(p)
    })

    s.on('game:question', ({ question, timeLimit, playerCount: pCount }) => {
      setCurrentQuestion(question)
      setTimeLeft(timeLimit || TIMER_DURATION)
      setAnswerCount(0)
      setTotalPlayers(pCount)
      setPlayerCount(pCount)
      setResults(null)
      setPhase('playing')
      setFadeIn(false)
      setTimeout(() => setFadeIn(true), 50)
    })

    s.on('game:answer-count', ({ count, total }) => {
      setAnswerCount(count)
      setTotalPlayers(total)
    })

    s.on('game:results', (data) => {
      setResults(data)
      setPhase('results')
      setFadeIn(false)
      setTimeout(() => setFadeIn(true), 50)
    })

    s.on('game:finished', ({ scores: finalScores }) => {
      setScores(finalScores)
      setPhase('finished')
      setFadeIn(false)
      setTimeout(() => setFadeIn(true), 50)
    })

    return () => { disconnect() }
  }, [])

  useEffect(() => {
    if (phase === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [phase, timeLeft])

  useEffect(() => {
    if (currentQuestion?.previewUrl && phase === 'playing') {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0 }
      const audio = new Audio(currentQuestion.previewUrl)
      audioRef.current = audio
      audio.play().catch(() => {})
      return () => { audio.pause(); audio.currentTime = 0 }
    }
  }, [currentQuestion, phase])

  const total = results?.players?.length || playerCount
  const answeredCount = results ? total : answerCount
  const timerPct = (timeLeft / TIMER_DURATION) * 100
  const isLow = timeLeft <= 10
  const isCritical = timeLeft <= 5

  if (phase === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#1a0a2e] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                animation: `float ${Math.random() * 8 + 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`,
                background: `rgba(255,255,255,${Math.random() * 0.1})`,
              }}
            />
          ))}
        </div>
        <div className="relative z-10 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 mb-4">
            <span className="text-5xl">🎯</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            ENGLISH CHALLENGE
          </h1>
          <p className="text-2xl text-white/40 font-light">Waiting for game to start...</p>
          {players.length > 0 && (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.06] rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-white/60">{players.length} players connected</span>
              </div>
              <div className="flex justify-center gap-2 flex-wrap max-w-md mx-auto">
                {players.map(p => (
                  <div key={p.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] rounded-full border border-white/[0.06]">
                    <span className="text-lg">{p.avatar || '🦸'}</span>
                    <span className="text-white/70 text-sm font-medium">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-30px) rotate(180deg); }
          }
        `}</style>
      </div>
    )
  }

  if (phase === 'playing' && currentQuestion) {
    const timerColor = isCritical ? '#EF4444' : isLow ? '#F59E0B' : '#10B981'
    return (
      <div className={`min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#1a0a2e] flex flex-col transition-opacity duration-500 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
        <header className="bg-white/[0.03] border-b border-white/[0.06] px-8 py-5 backdrop-blur-xl">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold text-white/40">{currentQuestion.title}</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-white/[0.06] rounded-xl">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-white/60 font-medium">{answeredCount}/{total} answered</span>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-8">
          <div className="max-w-4xl w-full text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight">
                {currentQuestion.question}
              </h2>
              {currentQuestion.type === 'grammar' && currentQuestion.prompt && (
                <p className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 italic">
                  "{currentQuestion.prompt}"
                </p>
              )}
            </div>

            {currentQuestion.type === 'guess-song' && currentQuestion.artworkUrl && (
              <div className="flex justify-center">
                <div className="relative">
                  <img src={currentQuestion.artworkUrl} alt="" className="w-56 h-56 md:w-64 md:h-64 rounded-3xl shadow-2xl object-cover ring-2 ring-white/10" />
                  <div className="absolute inset-0 rounded-3xl bg-black/20 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentQuestion.type === 'artist-info' && (
              <div className="flex items-center justify-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center border-2 border-white/10">
                  <span className="text-3xl">🎤</span>
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-white">{currentQuestion.artist?.name}</p>
                  <p className="text-white/40">{currentQuestion.artist?.nationality}</p>
                </div>
              </div>
            )}

            {currentQuestion.type === 'grammar' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                {currentQuestion.options.map((opt, i) => (
                  <div key={i} className="bg-white/[0.04] rounded-2xl p-4 border border-white/[0.06] text-center"
                    style={{ borderTop: `3px solid ${COLORS[i]}` }}>
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS[i] }}>
                      {['A', 'B', 'C', 'D'][i]}
                    </span>
                    <p className="text-white font-medium text-sm mt-1">{opt}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        <footer className="px-8 pb-8">
          <div className="max-w-3xl mx-auto space-y-2">
            <div className="relative w-full h-4 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${timerPct}%`, backgroundColor: timerColor, boxShadow: `0 0 20px ${timerColor}40` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/30 text-sm">{total - answeredCount} left</span>
              <span className={`text-5xl font-black tabular-nums transition-colors duration-300 ${
                isCritical ? 'text-red-500 animate-pulse' : isLow ? 'text-yellow-400' : 'text-white'
              }`}>
                {timeLeft}
              </span>
            </div>
          </div>
        </footer>
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }
        `}</style>
      </div>
    )
  }

  if (phase === 'results' && results) {
    const correctIdx = results.correctIndex
    const sortedPlayers = [...results.players].sort((a, b) => b.score - a.score)
    return (
      <div className={`min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#1a0a2e] flex flex-col p-8 transition-opacity duration-500 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-5xl mx-auto w-full space-y-8">
          <h2 className="text-4xl font-black text-white text-center">Results</h2>

          <div className="grid grid-cols-2 gap-4">
            {currentQuestion?.options.map((opt, i) => {
              const isCorrect = i === correctIdx
              const count = Object.values(results.answers).filter((a) => a === i).length
              const pct = total > 0 ? (count / total) * 100 : 0
              return (
                <div key={i} className={`rounded-2xl overflow-hidden transition-all duration-500 ${isCorrect ? 'ring-2 ring-emerald-500/50 scale-[1.02]' : ''}`}
                  style={{ backgroundColor: COLORS[i] + '15', border: `1px solid ${COLORS[i]}30` }}>
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black" style={{ color: COLORS[i] }}>
                        {['A', 'B', 'C', 'D'][i]}
                      </span>
                      {isCorrect && (
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                          ✓ Correct
                        </span>
                      )}
                    </div>
                    <p className="text-white text-lg font-medium leading-snug">{opt}</p>
                    <div className="w-full bg-white/[0.06] rounded-full h-4 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${pct}%`, backgroundColor: COLORS[i] }} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 font-medium">{count} answers</span>
                      <span className="text-2xl font-black text-white">{Math.round(pct)}%</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {sortedPlayers.length > 0 && (
            <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] overflow-hidden">
              <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">🏆 Leaderboard</h3>
                <span className="text-sm text-white/40">{sortedPlayers.length} players</span>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {sortedPlayers.slice(0, 10).map((p, i) => (
                  <div key={p.id} className={`flex items-center justify-between px-5 py-4 transition-all ${
                    i === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-amber-500/5' : ''
                  }`}>
                    <div className="flex items-center gap-4">
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                        i === 0 ? 'bg-yellow-500/20 text-yellow-400 text-lg' :
                        i === 1 ? 'bg-gray-300/20 text-gray-300 text-lg' :
                        i === 2 ? 'bg-amber-600/20 text-amber-500 text-lg' :
                        'bg-white/[0.06] text-white/40'
                      }`}>
                        {i + 1}
                      </span>
                      <span className="text-2xl">{p.avatar || '🦸'}</span>
                      <div>
                        <p className="text-white font-bold text-lg">{p.name}</p>
                        {i === 0 && <p className="text-yellow-400 text-xs font-semibold">Leading</p>}
                      </div>
                    </div>
                    <span className="text-2xl font-black text-white">{p.score.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (phase === 'finished') {
    const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a)
    const topPlayers = sorted.slice(0, 3).map(([id, score]) => {
      const p = players.find(pl => pl.id === id)
      return { name: p?.name || 'Unknown', avatar: p?.avatar, score }
    })

    return (
      <div className={`min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#1a0a2e] flex items-center justify-center p-8 relative overflow-hidden transition-opacity duration-500 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div key={i} className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                animation: `float ${Math.random() * 10 + 6}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 6}s`,
                background: i % 2 === 0 ? 'rgba(250,204,21,0.15)' : 'rgba(168,85,247,0.1)',
              }}
            />
          ))}
        </div>
        <div className="relative z-10 text-center space-y-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/20">
            <span className="text-6xl">🏆</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
            GAME OVER
          </h1>

          {topPlayers.length > 0 && (
            <div className="flex justify-center gap-6 items-end">
              {topPlayers.length > 1 && (
                <div className="bg-white/[0.03] rounded-2xl p-6 border border-white/[0.06] w-36">
                  <div className="text-3xl mb-2">🥈</div>
                  <div className="text-4xl mb-1">{topPlayers[1].avatar || '🦸'}</div>
                  <p className="text-white font-bold text-lg">{topPlayers[1].name}</p>
                  <p className="text-gray-300 text-sm font-semibold">{topPlayers[1].score.toLocaleString()} pts</p>
                </div>
              )}
              {topPlayers.length > 0 && (
                <div className="bg-gradient-to-b from-yellow-500/10 to-transparent rounded-2xl p-8 border border-yellow-500/30 shadow-lg shadow-yellow-500/10 w-40 -mt-4">
                  <div className="text-4xl mb-2">🥇</div>
                  <div className="text-5xl mb-1">{topPlayers[0].avatar || '🦸'}</div>
                  <p className="text-white font-bold text-xl">{topPlayers[0].name}</p>
                  <p className="text-yellow-400 text-lg font-black">{topPlayers[0].score.toLocaleString()} pts</p>
                </div>
              )}
              {topPlayers.length > 2 && (
                <div className="bg-white/[0.03] rounded-2xl p-6 border border-white/[0.06] w-36">
                  <div className="text-3xl mb-2">🥉</div>
                  <div className="text-4xl mb-1">{topPlayers[2].avatar || '🦸'}</div>
                  <p className="text-white font-bold text-lg">{topPlayers[2].name}</p>
                  <p className="text-amber-500 text-sm font-semibold">{topPlayers[2].score.toLocaleString()} pts</p>
                </div>
              )}
            </div>
          )}
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-25px) rotate(180deg); }
          }
        `}</style>
      </div>
    )
  }

  return null
}
