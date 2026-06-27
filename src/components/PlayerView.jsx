import { useState, useEffect, useCallback, useRef } from 'react'
import { connectToHost, onClientData, destroyClient, clientSend } from '../peer-service'
import AvatarDisplay from './AvatarDisplay'

const COLORS = ['#E74C3C', '#3498DB', '#F1C40F', '#2ECC71']

const AVATARS = [
  { src: '/avatars/SMO.png', label: 'SMO' },
  { src: '/avatars/Gemini_Generated_Image_ryvr27ryvr27ryvr.png', label: 'Star' },
  { src: '/avatars/Gemini_Generated_Image_t1phe6t1phe6t1ph.png', label: 'Flame' },
  { src: '/avatars/selena.png', label: 'Selena Gomez' },
  { src: '/avatars/joji.png', label: 'Joji' },
  { src: '/avatars/weeknd.png', label: 'The Weeknd' },
  { src: '/avatars/bieber.png', label: 'Justin Bieber' },
  { src: '/avatars/rammstein.png', label: 'Rammstein' },
]

export default function PlayerView() {
  const [phase, setPhase] = useState('join')
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [avatar, setAvatar] = useState('/avatars/SMO.png')
  const [error, setError] = useState('')
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [timeLeft, setTimeLeft] = useState(30)
  const [fadeIn, setFadeIn] = useState(false)
  const [resultData, setResultData] = useState(null)
  const [score, setScore] = useState(0)
  const [roundScore, setRoundScore] = useState(0)
  const clientRef = useRef(null)
  const playerIdRef = useRef(null)
  const audioRef = useRef(null)
  const scoreRef = useRef(0)
  const questionRef = useRef(null)

  useEffect(() => { scoreRef.current = score }, [score])
  useEffect(() => { questionRef.current = currentQuestion }, [currentQuestion])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('player_session')
      if (saved) {
        const { pin: savedPin, name: savedName, avatar: savedAvatar } = JSON.parse(saved)
        if (savedPin) setPin(savedPin)
        if (savedName) setName(savedName)
        if (savedAvatar) setAvatar(savedAvatar)
      }
    } catch {}
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
      if (clientRef.current) destroyClient(clientRef.current)
    }
  }, [])

  useEffect(() => {
    if (currentQuestion?.previewUrl && phase === 'question') {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0 }
      const audio = new Audio(currentQuestion.previewUrl)
      audioRef.current = audio
      audio.play().catch(() => {})
      return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0 } }
    }
  }, [currentQuestion, phase])

  const handleJoin = useCallback(async () => {
    if (!name.trim() || !pin.trim()) return
    setError('')
    const gamePin = pin.trim().toUpperCase()
    try {
      const client = await connectToHost(gamePin, 'player', name.trim(), avatar)
      clientRef.current = client
      playerIdRef.current = client.id
      try { localStorage.setItem('player_session', JSON.stringify({ pin: gamePin, name: name.trim(), avatar })) } catch {}

      setPhase('waiting')
      setFadeIn(true)

      onClientData(client.conn, (data) => {
        if (data.type === 'question') {
          setCurrentQuestion(data.question)
          setSelectedAnswer(null)
          setTimeLeft(data.timeLimit || 30)
          setResultData(null)
          setPhase('question')
          setFadeIn(false)
          setTimeout(() => setFadeIn(true), 50)
        } else if (data.type === 'results') {
          const myId = playerIdRef.current
          const myAnswer = data.answers?.[myId]
          const correctIdx = data.correctIndex
          const wasCorrect = myAnswer === correctIdx
          const myPlayer = data.players?.find(p => p.id === myId)
          const prevScore = scoreRef.current
          const newScore = myPlayer?.score || prevScore
          const earned = wasCorrect ? newScore - prevScore : 0
          setScore(newScore)
          setRoundScore(earned)
          setResultData({
            wasCorrect,
            correctIndex: correctIdx,
            correctAnswer: questionRef.current?.options?.[correctIdx],
            earned,
            question: questionRef.current,
            selectedAnswer: myAnswer,
          })
          setPhase('result')
          setFadeIn(true)
        } else if (data.type === 'finished') {
          setPhase('waiting')
          setFadeIn(true)
        }
      })
    } catch (e) {
      setError('No se pudo conectar. ' + (e ? e.message : 'Verifica el PIN e intenta de nuevo.'))
    }
  }, [name, pin, avatar])

  useEffect(() => {
    if (phase === 'question' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [phase, timeLeft])

  const handleAnswer = (index) => {
    if (!clientRef.current || selectedAnswer !== null) return
    setSelectedAnswer(index)
    clientSend(clientRef.current.conn, { type: 'answer', playerId: playerIdRef.current || clientRef.current.id, answerIndex: index })
  }

  if (phase === 'join') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#1a0a2e] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="particle" style={{
              left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`, height: `${Math.random() * 3 + 1}px`,
              animation: `float ${Math.random() * 8 + 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`, background: `rgba(255,255,255,${Math.random() * 0.12})`,
            }} />
          ))}
        </div>
        <div className="relative z-10 w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 mb-2">
              <span className="text-3xl">🎯</span>
            </div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">English Challenge</h1>
            <p className="text-white/40 text-sm">Enter the PIN to join the quiz</p>
          </div>
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-6 space-y-4 shadow-2xl">
            <div>
              <label className="text-xs uppercase tracking-widest text-white/30 font-semibold mb-2 block">Game PIN</label>
              <input value={pin} onChange={e => setPin(e.target.value.toUpperCase())}
                placeholder="XXXX"
                className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-4 text-white text-center text-3xl font-black tracking-[0.4em] outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all placeholder:text-white/10"
                maxLength={4} autoFocus />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-white/30 font-semibold mb-2 block">Your Name</label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all placeholder:text-white/20"
                maxLength={20} onKeyDown={e => e.key === 'Enter' && handleJoin()} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-white/30 font-semibold mb-3 block">Your Avatar</label>
              <div className="grid grid-cols-4 gap-3">
                {AVATARS.map((a, i) => {
                  const val = a.emoji || a.src
                  return (
                    <button key={a.emoji || a.src} onClick={() => setAvatar(val)}
                      className={`aspect-square rounded-2xl flex items-center justify-center transition-all duration-200 overflow-hidden ${avatar === val ? 'bg-purple-500/30 border-2 border-purple-400 scale-110 shadow-lg shadow-purple-500/20' : 'bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1]'}`}
                      title={a.label}>
                      {a.emoji ? <span className="text-2xl">{a.emoji}</span> : <img src={a.src} alt={a.label} className="w-full h-full object-cover" />}
                    </button>
                  )
                })}
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
        <style>{`@keyframes float{0%,100%{transform:translateY(0)rotate(0)}50%{transform:translateY(-15px)rotate(180deg)}}`}</style>
      </div>
    )
  }

  if (phase === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#1a0a2e] flex items-center justify-center p-4">
        <div className={`text-center space-y-6 transition-all duration-500 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20"><span className="text-4xl">⏳</span></div>
          <div>
            <h2 className="text-2xl font-bold text-white">You're in!</h2>
            <p className="text-white/50 mt-1">Waiting for the game to start...</p>
          </div>
          <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06] inline-block">
            <p className="text-xs uppercase tracking-widest text-white/30 font-semibold">Playing as</p>
            <div className="flex items-center gap-3 mt-2">
              <AvatarDisplay avatar={avatar} className="text-3xl" imgClass="w-12 h-12 rounded-full" />
              <p className="text-xl font-bold text-white">{name}</p>
            </div>
          </div>
          <div className="flex justify-center gap-2">
            {[0,1,2].map(i => <span key={i} className="w-3 h-3 rounded-full bg-white/20 animate-bounce" style={{animationDelay:`${i*0.2}s`}} />)}
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
            <span className="text-sm font-semibold text-white/40 uppercase tracking-wider">{currentQuestion.title}</span>
            <span className={`text-2xl font-black tabular-nums transition-colors ${isCritical ? 'text-red-500 animate-pulse' : isLow ? 'text-yellow-400' : 'text-white'}`}>{timeLeft}s</span>
          </div>
          <div className="w-full bg-white/[0.06] rounded-full h-2.5 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000 ease-linear" style={{ width: `${timerPct}%`, backgroundColor: timerColor }} />
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-center p-4">
          <div className="max-w-md mx-auto w-full space-y-6">
            {currentQuestion.previewUrl && (
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center animate-pulse">
                  <span className="text-3xl">🎵</span>
                </div>
              </div>
            )}
            <h2 className="text-2xl font-black text-white text-center leading-tight">{currentQuestion.question}</h2>
            {currentQuestion.type === 'grammar' && currentQuestion.prompt && (
              <p className="text-xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">"{currentQuestion.prompt}"</p>
            )}
            <div className="grid grid-cols-1 gap-3">
              {currentQuestion.options.map((opt, i) => {
                const isSelected = selectedAnswer === i
                return (
                  <button key={i} onClick={() => handleAnswer(i)} disabled={selectedAnswer !== null}
                    className={`relative w-full py-5 px-6 rounded-2xl font-bold text-white text-base md:text-lg transition-all duration-200 ${isSelected ? 'scale-[1.03]' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                    style={{
                      backgroundColor: COLORS[i],
                      boxShadow: isSelected ? `0 0 0 3px white, 0 0 20px ${COLORS[i]}60` : `0 4px 0 ${COLORS[i]}99, 0 8px 25px rgba(0,0,0,0.3)`,
                      opacity: selectedAnswer !== null && !isSelected ? 0.35 : 1,
                      transform: isSelected ? 'translateY(-2px)' : selectedAnswer !== null ? 'translateY(2px)' : 'translateY(0)',
                    }}>
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white/20 text-sm font-black mr-3">{['A','B','C','D'][i]}</span>
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

  if (phase === 'result' && resultData) {
    const { wasCorrect, correctAnswer, earned } = resultData
    return (
      <div className={`min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#1a0a2e] flex items-center justify-center p-4 transition-all duration-500 ${fadeIn ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <div className="text-center space-y-8 max-w-sm mx-auto">
          <div className={`w-28 h-28 rounded-full mx-auto flex items-center justify-center text-6xl border-4 ${wasCorrect ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-red-500/20 border-red-500/50'}`}>
            {wasCorrect ? '✅' : '❌'}
          </div>
          <div>
            <h2 className={`text-4xl font-black ${wasCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
              {wasCorrect ? 'Correct!' : 'Incorrect'}
            </h2>
            {!wasCorrect && correctAnswer && (
              <p className="text-white/60 mt-3 text-lg">
                Answer: <span className="text-white font-bold">{correctAnswer}</span>
              </p>
            )}
          </div>
          {wasCorrect && earned > 0 && (
            <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-2xl p-5 border border-amber-500/30">
              <p className="text-4xl font-black text-yellow-400">+{earned}</p>
              <p className="text-yellow-400/60 text-sm uppercase tracking-wider font-semibold mt-1">Points</p>
            </div>
          )}
          {score > 0 && (
            <div className="bg-white/[0.04] rounded-2xl p-4 border border-white/[0.06]">
              <p className="text-white/40 text-xs uppercase tracking-wider font-semibold">Total Score</p>
              <p className="text-2xl font-black text-white">{score.toLocaleString()}</p>
            </div>
          )}
          <div className="flex justify-center gap-2">
            {[0,1,2].map(i => <span key={i} className="w-3 h-3 rounded-full bg-purple-500/50 animate-bounce" style={{animationDelay:`${i*0.2}s`}} />)}
          </div>
          <p className="text-white/40 text-sm">Waiting for next question...</p>
        </div>
      </div>
    )
  }

  return null
}
