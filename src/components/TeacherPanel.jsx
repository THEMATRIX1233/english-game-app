import { useState, useEffect, useCallback } from 'react'
import { connect, disconnect } from '../socket'
import { getMultiplePopularSongs } from '../data/popularSongs'
import { getRandomArtist, getRandomQuestion } from '../data/teamData'

const QUESTION_TYPES = [
  { key: 'guess-song', label: '🎵 Guess Song', desc: 'Listen & identify the song' },
  { key: 'artist-info', label: '👤 Artist Info', desc: 'Facts about the artist' },
  { key: 'grammar', label: '📝 Grammar', desc: 'Tenses practice' },
]

const COLORS = ['#E74C3C', '#3498DB', '#F1C40F', '#2ECC71']

export default function TeacherPanel() {
  const [socket, setSocket] = useState(null)
  const [phase, setPhase] = useState('menu')
  const [pin, setPin] = useState('')
  const [players, setPlayers] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(8)
  const [answerCount, setAnswerCount] = useState(0)
  const [questions, setQuestions] = useState([])
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fadeIn, setFadeIn] = useState(true)

  useEffect(() => {
    const s = connect()
    setSocket(s)

    s.on('teacher:game-created', ({ pin: gamePin }) => {
      setPin(gamePin)
      setPhase('lobby')
      setFadeIn(true)
    })

    s.on('teacher:player-joined', (p) => {
      setPlayers([...p])
    })

    s.on('teacher:question-started', ({ question, questionIndex: qi, totalQuestions: tq }) => {
      setCurrentQuestion(question)
      setQuestionIndex(qi)
      setTotalQuestions(tq)
      setAnswerCount(0)
      setResults(null)
      setPhase('playing')
      setFadeIn(true)
    })

    s.on('teacher:answer-count', (count) => {
      setAnswerCount(count)
    })

    s.on('teacher:all-answered', () => {
      setTimeout(() => {
        if (socket && phase === 'playing') {
          socket.emit('teacher:show-results')
        }
      }, 1500)
    })

    s.on('teacher:results', (data) => {
      setResults(data)
      setPhase('results')
      setFadeIn(true)
    })

    s.on('teacher:game-ended', () => {
      setPhase('ended')
      setFadeIn(true)
    })

    return () => { disconnect() }
  }, [])

  const startGame = useCallback(async () => {
    setLoading(true)
    try {
      const songs = await getMultiplePopularSongs(10)
      if (songs.length < 4) return

      const musicQuestions = []
      for (let i = 0; i < Math.min(4, songs.length); i++) {
        const song = songs[i]
        const others = songs.filter(s => s.trackId !== song.trackId).slice(0, 3)
        const options = [...others.map(o => o.trackName), song.trackName]
        const shuffledOptions = options.sort(() => Math.random() - 0.5)

        musicQuestions.push({
          type: 'guess-song',
          title: '🎵 Guess the Song',
          question: 'Listen to the preview. What song is this?',
          previewUrl: song.previewUrl,
          artworkUrl: song.artworkUrl100?.replace('100x100', '200x200'),
          options: shuffledOptions,
          correctIndex: shuffledOptions.indexOf(song.trackName),
          correctAnswer: song.trackName,
          artist: song.artistName
        })
      }

      const artistQuestions = []
      const usedArtists = new Set()
      for (let i = 0; i < Math.min(4, 12); i++) {
        let artist = getRandomArtist()
        while (usedArtists.has(artist.name)) artist = getRandomArtist()
        usedArtists.add(artist.name)
        const allNationalities = ['German', 'British', 'Argentine', 'Spanish', 'Japanese', 'Mexican']
        const allSongs = ['Radio', 'Du hast', 'As It Was', 'Watermelon Sugar', 'Mentiste', 'Lady Blue', 'El jinete', 'Before The Day Is Over', 'SLOW DANCING IN THE DARK', 'After House', 'PARIS']
        const allGenres = ['Industrial Metal', 'Pop/Rock', 'Latin Trap', 'Rock/Latin', 'R&B/Lo-fi', 'Regional Mexican']
        const wrongOptions = [
          `From: ${allNationalities.filter(n => n !== artist.nationality).sort(() => Math.random() - 0.5)[0]}`,
          `Popular Song: "${allSongs.filter(s => s !== artist.popularSong).sort(() => Math.random() - 0.5)[0]}"`,
          `Genre: ${allGenres.filter(g => g !== artist.genre.split('/')[0]).sort(() => Math.random() - 0.5)[0]}`,
        ].sort(() => Math.random() - 0.5)
        const correctOption = `${artist.name} is from ${artist.nationality}.`
        const allOptions = [correctOption, ...wrongOptions].slice(0, 4).sort(() => Math.random() - 0.5)

        artistQuestions.push({
          type: 'artist-info',
          title: '👤 Artist Info',
          question: `What is true about ${artist.name}?`,
          artist,
          options: allOptions,
          correctIndex: allOptions.indexOf(correctOption),
          correctAnswer: `${artist.name} is from ${artist.nationality}. Popular song: "${artist.popularSong}".`,
          explanation: `${artist.name} is ${artist.nationality}. ${artist.concertFact}`,
        })
      }

      const grammarQuestions = []
      for (let i = 0; i < 4; i++) {
        const q = getRandomQuestion()
        grammarQuestions.push({ ...q, type: 'grammar' })
      }

      const allQuestions = [...musicQuestions, ...artistQuestions, ...grammarQuestions]
        .sort(() => Math.random() - 0.5)
        .slice(0, totalQuestions)

      setQuestions(allQuestions)
      if (socket) socket.emit('teacher:start-game', allQuestions)
    } catch (err) {
      console.error('Error starting game:', err)
    }
    setLoading(false)
  }, [socket, totalQuestions])

  const nextQuestion = useCallback(() => {
    setFadeIn(false)
    setTimeout(() => {
      if (socket) socket.emit('teacher:next-question')
    }, 200)
  }, [socket])

  const showResults = useCallback(() => {
    if (socket) socket.emit('teacher:show-results')
  }, [socket])

  const endGame = useCallback(() => {
    if (socket) socket.emit('teacher:end-game')
  }, [socket])

  const startOver = useCallback(() => {
    setPhase('menu')
    setPlayers([])
    setQuestions([])
    setCurrentQuestion(null)
    setResults(null)
    setFadeIn(true)
  }, [])

  const playerCount = players.length

  // ===== MENU =====
  if (phase === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#1a0a2e] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                animation: `float ${Math.random() * 8 + 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`,
                background: `rgba(255,255,255,${Math.random() * 0.15})`,
              }}
            />
          ))}
        </div>
        <div className={`relative z-10 bg-white/[0.03] backdrop-blur-2xl rounded-3xl border border-white/[0.06] p-10 text-center w-full max-w-md shadow-2xl transition-all duration-500 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 mb-2">
              <span className="text-4xl">🎯</span>
            </div>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                TEAM School
              </h1>
              <p className="text-xl font-bold text-white mt-1">English Challenge</p>
              <p className="text-sm text-white/40 mt-2">Music Quiz — Kahoot Style</p>
            </div>
          </div>

          <div className="mt-8 space-y-5">
            <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06]">
              <p className="text-xs uppercase tracking-widest text-white/30 mb-4 font-semibold">Questions per game</p>
              <div className="flex justify-center gap-3">
                {[4, 6, 8, 10, 12].map(n => (
                  <button key={n} onClick={() => setTotalQuestions(n)}
                    className={`w-12 h-12 rounded-xl font-bold text-sm transition-all duration-300 ${
                      totalQuestions === n
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25 scale-110'
                        : 'bg-white/[0.06] text-white/50 hover:bg-white/[0.1] hover:text-white/80'
                    }`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-left">
              {QUESTION_TYPES.map(qt => (
                <div key={qt.key} className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
                  <p className="text-lg">{qt.label}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{qt.desc}</p>
                </div>
              ))}
            </div>

            <button onClick={startGame} disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl font-bold text-lg text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <span className="inline-flex items-center gap-3">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Loading songs...
                </span>
              ) : '▶ Start Quiz'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ===== LOBBY =====
  if (phase === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#1a0a2e] flex items-center justify-center p-4 relative overflow-hidden">
        <div className={`relative z-10 bg-white/[0.03] backdrop-blur-2xl rounded-3xl border border-white/[0.06] p-10 text-center w-full max-w-md shadow-2xl transition-all duration-500 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 mb-2">
              <span className="text-3xl">🔑</span>
            </div>
            <p className="text-xs uppercase tracking-widest text-white/30 font-semibold">Game PIN</p>
            <div className="text-7xl font-black tracking-[0.15em] bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              {pin}
            </div>
            <p className="text-white/40 text-sm">Share this PIN with your students</p>
          </div>

          <div className="mt-8 bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-white/50 uppercase tracking-wider">Players</span>
              <span className="text-2xl font-bold text-white">{players.length}</span>
            </div>
            {players.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {players.map((p, i) => (
                  <div key={p.id} className="animate-slide-up inline-flex items-center gap-2 px-4 py-2.5 bg-white/[0.06] rounded-xl border border-white/[0.06]"
                    style={{ animationDelay: `${i * 50}ms` }}>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                    <span className="text-xl">{p.avatar || '🦸'}</span>
                    <span className="text-white font-medium">{p.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-6">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-3 h-3 rounded-full bg-white/10 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
                <span className="text-white/30 ml-3">Waiting for players...</span>
              </div>
            )}
          </div>

          <button onClick={nextQuestion} disabled={players.length === 0}
            className={`w-full mt-6 py-4 rounded-2xl font-bold text-lg text-white shadow-lg transition-all duration-200 ${
              players.length === 0
                ? 'bg-white/[0.06] text-white/30 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:scale-[1.02] active:scale-[0.98] shadow-blue-500/20'
            }`}>
            {players.length === 0 ? '⏳ Waiting...' : '▶ Start First Question'}
          </button>

          <button onClick={endGame} className="w-full mt-3 py-3 rounded-2xl font-medium text-sm text-red-400/70 border border-red-500/20 hover:bg-red-500/10 hover:text-red-400 transition-all">
            Cancel Game
          </button>
        </div>
      </div>
    )
  }

  // ===== PLAYING =====
  if (phase === 'playing' && currentQuestion) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#1a0a2e] flex flex-col transition-all duration-500 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
        <header className="bg-white/[0.03] border-b border-white/[0.06] px-6 py-4 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.06] rounded-lg">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Round</span>
                <span className="text-lg font-bold text-white">{questionIndex + 1}/{totalQuestions}</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.06] rounded-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Answered</span>
                <span className="text-lg font-bold text-emerald-400">{answerCount}/{players.length}</span>
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className={`max-w-2xl w-full space-y-8 transition-all duration-500 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="text-center space-y-2">
              <span className="inline-block text-4xl mb-2">{currentQuestion.title?.split(' ')[0]}</span>
              <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
                {currentQuestion.question}
              </h2>
              {currentQuestion.type === 'grammar' && currentQuestion.prompt && (
                <p className="text-2xl font-bold text-purple-400 mt-4 italic">"{currentQuestion.prompt}"</p>
              )}
            </div>

            {currentQuestion.type === 'guess-song' && currentQuestion.artworkUrl && (
              <div className="flex justify-center">
                <div className="relative group">
                  <img src={currentQuestion.artworkUrl} alt="" className="w-48 h-48 md:w-56 md:h-56 rounded-2xl shadow-2xl object-cover" />
                  <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                      <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentQuestion.type === 'artist-info' && currentQuestion.artist && (
              <div className="bg-white/[0.03] rounded-2xl p-6 border border-white/[0.06] text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 mx-auto flex items-center justify-center border-2 border-white/10">
                  <span className="text-4xl">🎤</span>
                </div>
                <h3 className="text-2xl font-bold text-white mt-3">{currentQuestion.artist.name}</h3>
                <p className="text-white/40">{currentQuestion.artist.nationality}</p>
              </div>
            )}

            {currentQuestion.type === 'grammar' && (
              <div className="grid grid-cols-2 gap-3">
                {currentQuestion.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]"
                    style={{ borderLeftColor: COLORS[i], borderLeftWidth: 3 }}>
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: COLORS[i] + '30', color: COLORS[i] }}>
                      {['A', 'B', 'C', 'D'][i]}
                    </span>
                    <span className="text-white font-medium text-sm">{opt}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={showResults}
                className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl font-bold text-white shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                📊 Show Results
              </button>
              <button onClick={nextQuestion}
                className="px-8 py-3.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl font-bold text-white shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                ⏭ Next Question
              </button>
              <button onClick={endGame}
                className="px-8 py-3.5 bg-white/[0.06] rounded-2xl font-bold text-red-400 hover:bg-white/[0.1] transition-all">
                End Game
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ===== RESULTS =====
  if (phase === 'results' && results) {
    const sorted = [...results.players].sort((a, b) => b.score - a.score)
    return (
      <div className={`min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#1a0a2e] flex flex-col transition-all duration-500 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
        <header className="bg-white/[0.03] border-b border-white/[0.06] px-6 py-4 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <span className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.06] rounded-lg">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Round</span>
              <span className="text-lg font-bold text-white">{questionIndex}/{totalQuestions}</span>
            </span>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6">
          <div className={`max-w-3xl w-full space-y-6 transition-all duration-500 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="text-center">
              <h2 className="text-3xl font-black text-white">Results</h2>
              {currentQuestion && (
                <p className="text-white/50 mt-1">{currentQuestion.question}</p>
              )}
            </div>

            {currentQuestion?.type === 'artist-info' && currentQuestion?.explanation && (
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-4 border border-purple-500/20 text-center">
                <p className="text-white/70 text-sm">{currentQuestion.explanation}</p>
              </div>
            )}

            {currentQuestion?.type === 'grammar' && (
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-4 border border-blue-500/20 text-center">
                <p className="text-emerald-400 font-bold text-lg">{currentQuestion.options[currentQuestion.correctIndex]}</p>
                {currentQuestion.explanation && (
                  <p className="text-white/50 text-sm mt-1">{currentQuestion.explanation}</p>
                )}
              </div>
            )}

            {currentQuestion?.correctAnswer && currentQuestion?.type !== 'grammar' && (
              <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl p-4 border border-emerald-500/20 text-center">
                <p className="text-emerald-400 font-bold text-lg">{currentQuestion.correctAnswer}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {currentQuestion?.options.map((opt, i) => {
                const count = Object.values(results.answers).filter(a => a === i).length
                const total = results.players.length || 1
                const pct = (count / total) * 100
                const isCorrect = i === results.correctIndex
                return (
                  <div key={i} className={`rounded-2xl overflow-hidden transition-all duration-300 ${isCorrect ? 'ring-2 ring-emerald-500/50' : ''}`}
                    style={{ backgroundColor: COLORS[i] + '15', border: `1px solid ${COLORS[i]}30` }}>
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS[i] }}>
                          {['A', 'B', 'C', 'D'][i]}
                        </span>
                        {isCorrect && <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">✓ Correct</span>}
                      </div>
                      <p className="text-white text-sm font-medium leading-snug line-clamp-2">{opt}</p>
                      <div className="w-full bg-white/[0.06] rounded-full h-2 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: COLORS[i] }} />
                      </div>
                      <p className="text-white/40 text-xs">{count}/{total} ({Math.round(pct)}%)</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {sorted.length > 0 && (
              <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] overflow-hidden">
                <div className="p-4 border-b border-white/[0.06]">
                  <h3 className="text-lg font-bold text-white">🏆 Leaderboard</h3>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {sorted.slice(0, 5).map((p, i) => (
                    <div key={p.id} className={`flex items-center justify-between px-4 py-3 transition-all ${
                      i === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-amber-500/5' : ''
                    }`}>
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black ${
                          i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                          i === 1 ? 'bg-gray-300/20 text-gray-300' :
                          i === 2 ? 'bg-amber-600/20 text-amber-500' :
                          'bg-white/[0.06] text-white/40'
                        }`}>
                          {i + 1}
                        </span>
                        <span className="text-xl">{p.avatar || '🦸'}</span>
                        <span className="text-white font-semibold">{p.name}</span>
                      </div>
                      <span className="text-white font-black">{p.score.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={nextQuestion}
                className="px-8 py-3.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl font-bold text-white shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                {questionIndex + 1 < totalQuestions ? '⏭ Next Question' : '🏁 Final Results'}
              </button>
              <button onClick={endGame}
                className="px-8 py-3.5 bg-white/[0.06] rounded-2xl font-bold text-red-400 hover:bg-white/[0.1] transition-all">
                End Game
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ===== ENDED =====
  if (phase === 'ended') {
    const sorted = results?.players
      ? [...results.players].sort((a, b) => b.score - a.score)
      : []
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#1a0a2e] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div key={i} className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                animation: `float ${Math.random() * 10 + 6}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 6}s`,
                background: i % 3 === 0 ? 'rgba(250,204,21,0.2)' : i % 3 === 1 ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.08)',
              }}
            />
          ))}
        </div>
        <div className={`relative z-10 text-center space-y-8 transition-all duration-700 ${fadeIn ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/20">
            <span className="text-6xl">🏆</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white">Game Over</h1>

          {sorted.length > 0 && (
            <div className="max-w-md mx-auto space-y-6">
              <div className="flex justify-center gap-4">
                {sorted.slice(0, 3).map((p, i) => (
                  <div key={p.id} className={`bg-white/[0.03] rounded-2xl p-5 border backdrop-blur-xl transition-all ${
                    i === 0
                      ? 'border-yellow-500/30 bg-gradient-to-b from-yellow-500/10 to-transparent scale-110 shadow-lg shadow-yellow-500/10'
                      : 'border-white/[0.06]'
                  }`}>
                    <div className="text-2xl mb-1">{['🥇', '🥈', '🥉'][i]}</div>
                    <div className="text-3xl mb-1">{p.avatar || '🦸'}</div>
                    <p className="text-white font-bold text-lg">{p.name}</p>
                    <p className={`text-sm font-black ${i === 0 ? 'text-yellow-400' : 'text-white/50'}`}>
                      {p.score.toLocaleString()} pts
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={startOver}
            className="px-10 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl font-bold text-lg text-white shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
            Play Again
          </button>
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }
        `}</style>
      </div>
    )
  }

  return null
}
