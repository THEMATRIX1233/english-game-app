import { useState, useEffect, useCallback } from 'react'
import { connect, disconnect } from '../socket'

const COLORS = ['#E74C3C', '#3498DB', '#F1C40F', '#2ECC71']
const COLOR_NAMES = ['red', 'blue', 'yellow', 'green']

const AVATARS = [
  { emoji: '🦸', label: 'Hero' }, { emoji: '🧙', label: 'Wizard' },
  { emoji: '🦄', label: 'Unicorn' }, { emoji: '🤖', label: 'Robot' },
  { emoji: '👾', label: 'Alien' }, { emoji: '🐱', label: 'Cat' },
  { emoji: '🦊', label: 'Fox' }, { emoji: '🐼', label: 'Panda' },
  { emoji: '🎮', label: 'Gamer' }, { emoji: '🧝', label: 'Elf' },
  { emoji: '🧛', label: 'Vampire' }, { emoji: '🐉', label: 'Dragon' },
]

export default function PlayerView() {
  const [socket, setSocket] = useState(null)
  const [phase, setPhase] = useState('join')
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [avatar, setAvatar] = useState('🦸')
  const [error, setError] = useState('')
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [timeLeft, setTimeLeft] = useState(30)
  const [fadeIn, setFadeIn] = useState(false)

  const handleJoin = useCallback(() => {
    if (!name.trim() || !pin.trim()) return
    const s = connect()
    setSocket(s)

    s.on('connect', () => {
      s.emit('player:join', { name: name.trim(), pin: pin.trim().toUpperCase(), avatar })
    })

    s.on('player:join-error', (msg) => {
      setError(msg)
      disconnect()
      setSocket(null)
    })

    s.on('player:joined', () => {
      setPhase('waiting')
      setFadeIn(true)
    })

    s.on('player:question', ({ question, timeLimit }) => {
      setCurrentQuestion(question)
      setSelectedAnswer(null)
      setTimeLeft(timeLimit || 30)
      setPhase('question')
      setFadeIn(false)
      setTimeout(() => setFadeIn(true), 50)
    })

    s.on('player:answer-confirmed', () => {
      setPhase('answered')
      setFadeIn(false)
      setTimeout(() => setFadeIn(true), 50)
    })
  }, [name, pin])

  useEffect(() => {
    return () => { disconnect() }
  }, [])

  useEffect(() => {
    if (phase === 'question' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [phase, timeLeft])

  const handleAnswer = (index) => {
    if (!socket || selectedAnswer !== null) return
    setSelectedAnswer(index)
    socket.emit('player:answer', { answerIndex: index })
  }

  if (phase === 'join') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#1a0a2e] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                animation: `float ${Math.random() * 8 + 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`,
                background: `rgba(255,255,255,${Math.random() * 0.12})`,
              }}
            />
          ))}
        </div>
        <div className="relative z-10 w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 mb-2">
              <span className="text-3xl">🎯</span>
            </div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              English Challenge
            </h1>
            <p className="text-white/40 text-sm">Enter the PIN to join the quiz</p>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-6 space-y-4 shadow-2xl">
            <div>
              <label className="text-xs uppercase tracking-widest text-white/30 font-semibold mb-2 block">
                Game PIN
              </label>
              <input value={pin} onChange={e => setPin(e.target.value.toUpperCase())}
                placeholder="XXXX"
                className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-4 text-white text-center text-3xl font-black tracking-[0.4em] outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all placeholder:text-white/10"
                maxLength={4} autoFocus />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-white/30 font-semibold mb-2 block">
                Your Name
              </label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all placeholder:text-white/20"
                maxLength={20}
                onKeyDown={e => e.key === 'Enter' && handleJoin()} />
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-white/30 font-semibold mb-3 block">
                Your Avatar
              </label>
              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map(a => (
                  <button key={a.emoji} onClick={() => setAvatar(a.emoji)}
                    className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-all duration-200 ${
                      avatar === a.emoji
                        ? 'bg-purple-500/30 border-2 border-purple-400 scale-110 shadow-lg shadow-purple-500/20'
                        : 'bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1]'
                    }`}
                    title={a.label}>
                    {a.emoji}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm text-center font-medium">{error}</p>
              </div>
            )}

            <button onClick={handleJoin} disabled={!name.trim() || !pin.trim()}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl font-bold text-white text-lg shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100">
              Join Game
            </button>
          </div>
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-15px) rotate(180deg); }
          }
        `}</style>
      </div>
    )
  }

  if (phase === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#1a0a2e] flex items-center justify-center p-4">
        <div className={`text-center space-y-6 transition-all duration-500 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20">
            <span className="text-4xl">⏳</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">You're in!</h2>
            <p className="text-white/50 mt-1">Waiting for the game to start...</p>
          </div>
          <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06] inline-block">
            <p className="text-xs uppercase tracking-widest text-white/30 font-semibold">Playing as</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-3xl">{avatar}</span>
              <p className="text-xl font-bold text-white">{name}</p>
            </div>
          </div>
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map(i => (
              <span key={i} className="w-3 h-3 rounded-full bg-white/20 animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'question' && currentQuestion) {
    const timerPct = (timeLeft / 30) * 100
    const isLow = timeLeft <= 10
    const isCritical = timeLeft <= 5
    const timerColor = isCritical ? '#EF4444' : isLow ? '#F59E0B' : '#10B981'

    return (
      <div className={`min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#1a0a2e] flex flex-col transition-opacity duration-300 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white/40 uppercase tracking-wider">
              {currentQuestion.title}
            </span>
            <span className={`text-2xl font-black tabular-nums transition-colors ${isCritical ? 'text-red-500 animate-pulse' : isLow ? 'text-yellow-400' : 'text-white'}`}>
              {timeLeft}s
            </span>
          </div>
          <div className="w-full bg-white/[0.06] rounded-full h-2.5 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${timerPct}%`, backgroundColor: timerColor }} />
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center p-4">
          <div className="max-w-md mx-auto w-full space-y-6">
            <h2 className="text-2xl font-black text-white text-center leading-tight">
              {currentQuestion.question}
            </h2>
            {currentQuestion.type === 'grammar' && currentQuestion.prompt && (
              <p className="text-xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                "{currentQuestion.prompt}"
              </p>
            )}

            <div className="grid grid-cols-1 gap-3">
              {currentQuestion.options.map((opt, i) => {
                const isSelected = selectedAnswer === i
                return (
                  <button key={i} onClick={() => handleAnswer(i)}
                    disabled={selectedAnswer !== null}
                    className={`relative w-full py-5 px-6 rounded-2xl font-bold text-white text-base md:text-lg transition-all duration-200 ${
                      isSelected ? 'scale-[1.03]' : 'hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                    style={{
                      backgroundColor: COLORS[i],
                      boxShadow: isSelected
                        ? `0 0 0 3px white, 0 0 20px ${COLORS[i]}60`
                        : `0 4px 0 ${COLORS[i]}99, 0 8px 25px rgba(0,0,0,0.3)`,
                      opacity: selectedAnswer !== null && !isSelected ? 0.35 : 1,
                      transform: isSelected ? 'translateY(-2px)' :
                        selectedAnswer !== null ? 'translateY(2px)' : 'translateY(0)',
                    }}>
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white/20 text-sm font-black mr-3">
                      {['A', 'B', 'C', 'D'][i]}
                    </span>
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'answered') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#1a0a2e] flex items-center justify-center p-4">
        <div className={`text-center space-y-6 transition-all duration-500 ${fadeIn ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20">
            <span className="text-4xl">✅</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Answer submitted!</h2>
            <p className="text-white/50 mt-1">Waiting for others to finish...</p>
          </div>
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map(i => (
              <span key={i}
                className="w-3 h-3 rounded-full bg-emerald-500/50 animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return null
}
