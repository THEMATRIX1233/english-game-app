import { useState, useEffect, useCallback, useRef } from 'react'
import { generatePin, createHost, onHostConnection, hostBroadcast, hostSend, destroyHost } from '../peer-service'
import AvatarDisplay from './AvatarDisplay'
import { getStudentById } from '../data/profiles'
import { getQuestionsForStudent } from '../data/artistQuestions'
import { popularSongs, enrichWithItunesData } from '../data/popularSongs'
import { getRandomQuestion } from '../data/teamData'
import { teamArtists } from '../data/teamPlaylist'

const COLORS = ['#E74C3C', '#3498DB', '#F1C40F', '#2ECC71']

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

export default function ArtistTeacherPanel({ studentId, onBack }) {
  const ids = studentId.includes('+') ? studentId.split('+') : [studentId]
  const presenters = ids.map(id => getStudentById(id)).filter(Boolean)
  const mainStudent = presenters[0]
  const artists = presenters.map(s => teamArtists.find(a => a.name === s?.artist)).filter(Boolean)
  const customQuestions = presenters.flatMap(s => getQuestionsForStudent(s?.id))
  const artistSongs = presenters.flatMap(s => popularSongs.filter(song => song.artistName === s?.artist))

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
  const [pairs, setPairs] = useState([])
  const [newPlayerName, setNewPlayerName] = useState('')
  const hostRef = useRef(null)
  const answersRef = useRef({})
  const questionStartRef = useRef(null)
  const questionTimeLimitRef = useRef(30)
  const playersRef = useRef([])

  useEffect(() => {
    return () => { if (hostRef.current) destroyHost(hostRef.current) }
  }, [])

  const broadcastPlayers = useCallback(() => {
    const host = hostRef.current
    if (!host) return
    hostBroadcast(host, { type: 'playerList', players: playersRef.current })
  }, [])

  const buildArtistQuestions = useCallback(() => {
    const allQuestions = []
    customQuestions.forEach(q => allQuestions.push({ ...q, type: 'custom', title: `❓ ${artists.map(a => a.name).join(' & ')}` }))
    if (artistSongs.length >= 2) {
      const shuffledSongs = shuffle(artistSongs)
      for (let i = 0; i < Math.min(3, shuffledSongs.length); i++) {
        const correct = shuffledSongs[i]
        const others = shuffle(artistSongs.filter(s => s.trackName !== correct.trackName))
        const options = shuffle([{ text: correct.trackName, correct: true }, ...others.slice(0, 3).map(s => ({ text: s.trackName, correct: false }))])
        allQuestions.push({
          type: 'guess-song', title: '🎵 Guess the Song',
          question: 'Listen to the preview. What song is this?',
          previewUrl: correct.previewUrl, artworkUrl: correct.artworkUrl100?.replace('100x100', '200x200'),
          options: options.map(o => o.text), correctIndex: options.findIndex(o => o.correct),
          correctAnswer: correct.trackName, artist: correct.artistName,
        })
      }
    }
    const grammarPool = []
    const artistNames = artists.map(a => a.name.toLowerCase())
    for (let i = 0; i < 8; i++) { const q = getRandomQuestion(); if (artistNames.some(name => q.prompt?.toLowerCase().includes(name))) grammarPool.push({ ...q, type: 'grammar', title: '📝 Grammar' }) }
    while (grammarPool.length < 3) grammarPool.push({ ...getRandomQuestion(), type: 'grammar', title: '📝 Grammar' })
    grammarPool.slice(0, 4).forEach(q => allQuestions.push(q))
    artists.forEach(art => {
      const countries = ['Germany', 'the UK', 'Argentina', 'Spain', 'Japan', 'Mexico', 'Canada', 'the United States', 'Colombia']
      const wrongCountries = countries.filter(c => c !== art.country).sort(() => Math.random() - 0.5)
      allQuestions.push({
        type: 'artist-info', title: '👤 Artist Info', question: `What is true about ${art.name}?`, artist: art,
        options: shuffle([`From: ${art.country}`, `From: ${wrongCountries[0]}`, `From: ${wrongCountries[1]}`, `From: ${wrongCountries[2]}`]),
        correctIndex: 0, correctAnswer: `${art.name} is from ${art.country}.`, explanation: `${art.name} is from ${art.country}. ${art.concertFact}`,
      })
    })
    return shuffle(allQuestions).slice(0, totalQuestions)
  }, [artists, artistSongs, customQuestions, totalQuestions])

  const startGame = useCallback(async () => {
    setLoading(true)
    const gameQuestions = buildArtistQuestions()
    const enriched = await Promise.all(gameQuestions.map(async q => {
      if (q.type === 'guess-song' && !q.previewUrl) {
        const song = popularSongs.find(s => s.trackName === q.correctAnswer && s.artistName === q.artist)
        if (song) {
          const enrichedSong = await enrichWithItunesData(song)
          if (enrichedSong.previewUrl) return { ...q, previewUrl: enrichedSong.previewUrl, artworkUrl: enrichedSong.artworkUrl100?.replace('100x100', '200x200') }
        }
      }
      return q
    }))
    setQuestions(enriched)

    let host
    for (let attempt = 0; attempt < 10; attempt++) {
      const p = generatePin()
      try { host = await createHost(p); break } catch { continue }
    }
    if (!host) { setLoading(false); return }

    hostRef.current = host
    const gamePin = host.pin
    setPin(gamePin)

    onHostConnection(host, (conn, info, data) => {
      if (data.type === 'join' && data.role !== 'display') {
        playersRef.current = playersRef.current.filter(p => p.name !== info.name)
        const player = { id: info.playerId, name: info.name, avatar: info.avatar || '👤', score: 0 }
        playersRef.current = [...playersRef.current, player]
        setPlayers(playersRef.current)
        broadcastPlayers()
        hostSend(conn, { type: 'joined', playerId: info.playerId })
      } else if (data.type === 'answer') {
        if (!answersRef.current[data.playerId]) {
          answersRef.current[data.playerId] = data.answerIndex
          setAnswerCount(Object.keys(answersRef.current).length)
          hostBroadcast(host, {
            type: 'answerCount',
            count: Object.keys(answersRef.current).length,
            total: playersRef.current.length,
          })
        }
      }
    })

    setPhase('lobby')
    setFadeIn(true)
    setLoading(false)
  }, [buildArtistQuestions, broadcastPlayers])

  const handleNextQuestion = useCallback(() => {
    setFadeIn(false)
    setTimeout(() => {
      const idx = questionIndex + 1
      if (idx >= questions.length) {
        const host = hostRef.current
        if (!host) return
        const scores = {}
        playersRef.current.forEach(p => { scores[p.id] = p.score })
        hostBroadcast(host, { type: 'finished', scores, players: playersRef.current })
        setPhase('ended')
        setFadeIn(true)
        return
      }
      const q = questions[idx]
      setCurrentQuestion(q)
      setQuestionIndex(idx)
      answersRef.current = {}
      questionStartRef.current = Date.now()
      questionTimeLimitRef.current = 30
      setResults(null)
      setPhase('playing')
      setFadeIn(true)
      const host = hostRef.current
      if (host) {
        hostBroadcast(host, {
          type: 'question', question: q,
          timeLimit: 30, questionIndex: idx,
          totalQuestions: questions.length,
        })
      }
    }, 200)
  }, [questionIndex, questions.length])

  const handleShowResults = useCallback(() => {
    const host = hostRef.current
    if (!host || !currentQuestion) return
    const correctIdx = currentQuestion.correctIndex ?? 0
    const elapsed = questionStartRef.current ? (Date.now() - questionStartRef.current) / 1000 : 0
    const timeBonus = Math.max(0, Math.floor((questionTimeLimitRef.current - elapsed))) * 10
    Object.entries(answersRef.current).forEach(([pid, ansIdx]) => {
      if (ansIdx === correctIdx) {
        const p = playersRef.current.find(x => x.id === pid)
        if (p) p.score += 1000 + timeBonus
      }
    })
    setPlayers([...playersRef.current])
    const resultsData = {
      answers: { ...answersRef.current },
      correctIndex: correctIdx,
      players: playersRef.current.map(p => ({ ...p })),
    }
    setResults(resultsData)
    setPhase('results')
    setFadeIn(true)
    hostBroadcast(host, { type: 'results', ...resultsData })
  }, [currentQuestion])

  const handleEndGame = useCallback(() => {
    const host = hostRef.current
    if (!host) return
    const scores = {}
    playersRef.current.forEach(p => { scores[p.id] = p.score })
    hostBroadcast(host, { type: 'finished', scores, players: playersRef.current })
    setPhase('ended')
    setFadeIn(true)
  }, [])

  const startOver = useCallback(() => {
    if (hostRef.current) destroyHost(hostRef.current)
    hostRef.current = null
    setPhase('menu'); setPlayers([]); setQuestions([])
    setCurrentQuestion(null); setResults(null); setPairs([]); setFadeIn(true)
    answersRef.current = {}; playersRef.current = []
    setPin(''); setAnswerCount(0); setQuestionIndex(0)
  }, [])

  const addLocalPlayer = () => {
    if (!newPlayerName.trim()) return
    const name = newPlayerName.trim()
    if (playersRef.current.find(p => p.name.toLowerCase() === name.toLowerCase())) return
    const player = { id: `local_${Date.now()}`, name, avatar: '👤', score: 0 }
    playersRef.current = [...playersRef.current, player]
    setPlayers(playersRef.current)
    setNewPlayerName('')
  }

  const removeLocalPlayer = (id) => {
    playersRef.current = playersRef.current.filter(p => p.id !== id)
    setPlayers([...playersRef.current])
    setPairs([])
  }

  const generatePairs = () => {
    const shuffled = [...players].sort(() => Math.random() - 0.5)
    const newPairs = []
    for (let i = 0; i < shuffled.length; i += 2) newPairs.push(i + 1 < shuffled.length ? [shuffled[i], shuffled[i + 1]] : [shuffled[i]])
    setPairs(newPairs)
  }

  if (!mainStudent) return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#1a0a2e] flex items-center justify-center p-4">
      <div className="text-center space-y-4"><span className="text-6xl">❌</span><h2 className="text-2xl font-bold text-white">Perfil no encontrado</h2><button onClick={onBack} className="px-6 py-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all">Volver al lobby</button></div>
    </div>
  )

  const playerCount = players.length
  const themeColor = mainStudent.color

  if (phase === 'menu') return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#1a0a2e] flex items-center justify-center p-4 relative overflow-hidden">
      <div className={`relative z-10 w-full max-w-md transition-all duration-500 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex items-center gap-3 mb-4"><button onClick={onBack} className="text-white/30 hover:text-white/60 text-sm flex items-center gap-1 transition-all">← Volver</button></div>
        <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl border border-white/[0.06] p-8 text-center shadow-2xl">
          <div className="space-y-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br mx-auto flex items-center justify-center text-5xl border-2 border-white/10" style={{ background: `linear-gradient(135deg, ${themeColor}40, ${themeColor}10)` }}>🎤</div>
            <div><h1 className="text-3xl font-black text-white">{presenters.map(s => s.name).join(' & ')}</h1><p className="text-white/50 text-sm mt-1">Presentando: {artists.map((a, i) => (<span key={a.name}><span className="font-bold" style={{ color: presenters[i]?.color || themeColor }}>{a.name}</span>{i < artists.length - 1 && <span className="text-white/30"> + </span>}</span>))}</p></div>
          </div>
          <div className="mt-6 space-y-4">
            <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06]">
              <p className="text-xs uppercase tracking-widest text-white/30 mb-3 font-semibold">Preguntas por juego</p>
              <div className="flex justify-center gap-2">
                {[4, 6, 8, 10, 12].map(n => (
                  <button key={n} onClick={() => setTotalQuestions(n)} className={`w-11 h-11 rounded-xl font-bold text-sm transition-all duration-300 ${totalQuestions === n ? 'text-white shadow-lg scale-110' : 'bg-white/[0.06] text-white/50 hover:bg-white/[0.1]'}`}
                    style={totalQuestions === n ? { background: `linear-gradient(135deg, ${themeColor}CC, ${themeColor}88)`, boxShadow: `0 0 20px ${themeColor}40` } : undefined}>{n}</button>
                ))}
              </div>
            </div>
            <button onClick={startGame} disabled={loading} className="w-full py-4 rounded-2xl font-bold text-lg text-white shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]" style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}AA)`, boxShadow: `0 0 30px ${themeColor}30` }}>
              {loading ? 'Preparando...' : `▶ Iniciar Kahoot de ${artists.map(a => a.name).join(' & ')}`}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes float{0%,100%{transform:translateY(0)rotate(0)}50%{transform:translateY(-25px)rotate(180deg)}}`}</style>
    </div>
  )

  if (phase === 'lobby') return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#1a0a2e] flex items-center justify-center p-4">
      <div className={`relative z-10 w-full max-w-md transition-all duration-500 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl border border-white/[0.06] p-8 text-center shadow-2xl">
          <div className="space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-2" style={{ background: `${themeColor}20`, border: `1px solid ${themeColor}40` }}><span className="text-3xl">🔑</span></div>
            <p className="text-xs uppercase tracking-widest text-white/30 font-semibold">Game PIN</p>
            <div className="text-7xl font-black tracking-[0.15em] bg-gradient-to-r bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${themeColor}, ${themeColor}88)` }}>{pin}</div>
            <p className="text-white/40 text-sm">Comparte este PIN con la clase</p>
            <p className="text-white/20 text-xs">Ellos entran a <code className="text-yellow-400/60">{window.location.origin}/#play</code></p>
          </div>
          <div className="mt-6 bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06]">
            <div className="flex items-center justify-between mb-4"><span className="text-sm font-semibold text-white/50 uppercase tracking-wider">Jugadores</span><span className="text-2xl font-bold text-white">{playerCount}</span></div>
            {playerCount > 0 ? (
              <div className="flex flex-wrap gap-2 justify-center">{players.map((p, i) => (
                <div key={p.id} className="inline-flex items-center gap-2 px-3 py-2 bg-white/[0.06] rounded-xl border border-white/[0.06]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                  <AvatarDisplay avatar={p.avatar} />
                  <span className="text-white font-medium text-sm">{p.name}</span>
                  {p.id.startsWith('local_') && <button onClick={() => removeLocalPlayer(p.id)} className="text-white/20 hover:text-red-400 text-xs ml-1">✕</button>}
                </div>
              ))}</div>
            ) : (
              <div className="flex items-center justify-center py-6">
                <div className="flex gap-1.5">{[0, 1, 2].map(i => (<span key={i} className="w-3 h-3 rounded-full bg-white/10 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />))}</div>
                <span className="text-white/30 ml-3">Esperando jugadores...</span>
              </div>
            )}
          </div>
          <div className="mt-4 bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06]">
            <div className="flex items-center justify-between mb-3"><span className="text-sm font-semibold text-white/50 uppercase tracking-wider">👥 Parejas</span><button onClick={generatePairs} disabled={playerCount < 2} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed" style={{ background: themeColor + '30' }}>🔀 Generar</button></div>
            {pairs.length > 0 ? (
              <div className="space-y-2">{pairs.map((pair, i) => (
                <div key={i} className="bg-white/[0.04] rounded-xl p-3 border border-white/[0.06] flex items-center justify-center gap-3">
                  {pair.map((p, j) => (<div key={p.name} className="flex items-center gap-2"><AvatarDisplay avatar={p.avatar} /><span className="text-white text-sm font-medium">{p.name}</span>{j < pair.length - 1 && <span className="text-white/20">⟷</span>}</div>))}
                </div>
              ))}</div>
            ) : <p className="text-white/30 text-xs text-center py-2">{playerCount < 2 ? 'Se necesitan al menos 2 jugadores' : 'Presiona "Generar" para crear parejas'}</p>}
            <div className="flex gap-2 mt-3">
              <input value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} placeholder="Nombre para parejas" className="flex-1 bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-purple-500/50 transition-all placeholder:text-white/20" onKeyDown={e => e.key === 'Enter' && addLocalPlayer()} />
              <button onClick={addLocalPlayer} disabled={!newPlayerName.trim()} className="px-3 py-2 bg-white/[0.08] rounded-lg text-white text-xs font-semibold hover:bg-white/[0.12] transition-all disabled:opacity-40">+ Agregar</button>
            </div>
          </div>
          <button onClick={handleNextQuestion} disabled={playerCount === 0} className={`w-full mt-6 py-4 rounded-2xl font-bold text-lg text-white shadow-lg transition-all duration-200 ${playerCount === 0 ? 'bg-white/[0.06] text-white/30 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
            style={playerCount > 0 ? { background: `linear-gradient(135deg, ${themeColor}, ${themeColor}AA)`, boxShadow: `0 0 30px ${themeColor}30` } : undefined}>
            {playerCount === 0 ? '⏳ Esperando jugadores...' : '▶ Empezar primera pregunta'}
          </button>
          <div className="flex gap-2 mt-3">
            <button onClick={handleEndGame} className="flex-1 py-3 rounded-2xl font-medium text-sm text-red-400/70 border border-red-500/20 hover:bg-red-500/10 hover:text-red-400 transition-all">Cancelar juego</button>
            <button onClick={startOver} className="flex-1 py-3 rounded-2xl font-medium text-sm text-white/40 border border-white/[0.06] hover:bg-white/[0.06] hover:text-white/60 transition-all">Reiniciar</button>
          </div>
        </div>
      </div>
    </div>
  )

  if (phase === 'playing' && currentQuestion) return (
    <div className={`min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#1a0a2e] flex flex-col transition-all duration-500 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
      <header className="bg-white/[0.03] border-b border-white/[0.06] px-6 py-4 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.06] rounded-lg"><span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: themeColor }} /><span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Ronda</span><span className="text-lg font-bold text-white">{questionIndex + 1}/{questions.length}</span></span>
          <span className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.06] rounded-lg"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Respondieron</span><span className="text-lg font-bold text-emerald-400">{answerCount}/{playerCount}</span></span>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <div className={`max-w-2xl w-full space-y-8 transition-all duration-500 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="text-center space-y-2">
            <span className="inline-block text-4xl mb-2">{currentQuestion.title?.split(' ')[0]}</span>
            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">{currentQuestion.question}</h2>
            {currentQuestion.type === 'grammar' && currentQuestion.prompt && <p className="text-2xl font-bold text-purple-400 mt-4 italic">"{currentQuestion.prompt}"</p>}
          </div>
          {currentQuestion.type === 'guess-song' && currentQuestion.artworkUrl && (
            <div className="flex justify-center"><div className="relative group"><img src={currentQuestion.artworkUrl} alt="" className="w-48 h-48 md:w-56 md:h-56 rounded-2xl shadow-2xl object-cover" /></div></div>
          )}
          {currentQuestion.type === 'artist-info' && currentQuestion.artist && (
            <div className="bg-white/[0.03] rounded-2xl p-6 border border-white/[0.06] text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br mx-auto flex items-center justify-center text-4xl border-2 border-white/10" style={{ background: `linear-gradient(135deg, ${themeColor}40, ${themeColor}10)` }}>🎤</div>
              <h3 className="text-2xl font-bold text-white mt-3">{currentQuestion.artist.name}</h3>
              <p className="text-white/40">{currentQuestion.artist.nationality}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">{currentQuestion.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-3 bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]" style={{ borderLeftColor: COLORS[i], borderLeftWidth: 3 }}>
              <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold" style={{ backgroundColor: COLORS[i] + '30', color: COLORS[i] }}>{['A', 'B', 'C', 'D'][i]}</span>
              <span className="text-white font-medium text-sm">{opt}</span>
            </div>
          ))}</div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={handleShowResults} className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl font-bold text-white shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all">📊 Mostrar resultados</button>
            <button onClick={handleNextQuestion} className="px-8 py-3.5 rounded-2xl font-bold text-white shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all" style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}AA)` }}>⏭ Siguiente pregunta</button>
            <button onClick={handleEndGame} className="px-8 py-3.5 bg-white/[0.06] rounded-2xl font-bold text-red-400 hover:bg-white/[0.1] transition-all">Terminar juego</button>
          </div>
        </div>
      </main>
    </div>
  )

  if (phase === 'results' && results) {
    const sorted = [...results.players].sort((a, b) => b.score - a.score)
    return (
      <div className={`min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#1a0a2e] flex flex-col transition-all duration-500 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
        <header className="bg-white/[0.03] border-b border-white/[0.06] px-6 py-4 backdrop-blur-xl">
          <span className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.06] rounded-lg"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: themeColor }} /><span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Ronda</span><span className="text-lg font-bold text-white">{questionIndex}/{questions.length}</span></span>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center p-6">
          <div className={`max-w-3xl w-full space-y-6 transition-all duration-500 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="text-center"><h2 className="text-3xl font-black text-white">Resultados</h2>{currentQuestion && <p className="text-white/50 mt-1">{currentQuestion.question}</p>}</div>
            {currentQuestion?.correctAnswer && currentQuestion?.type !== 'grammar' && <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl p-4 border border-emerald-500/20 text-center"><p className="text-emerald-400 font-bold text-lg">{currentQuestion.correctAnswer}</p></div>}
            {currentQuestion?.type === 'grammar' && <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-4 border border-blue-500/20 text-center"><p className="text-emerald-400 font-bold text-lg">{currentQuestion.options[currentQuestion.correctIndex]}</p></div>}
            <div className="grid grid-cols-2 gap-3">{currentQuestion?.options.map((opt, i) => {
              const count = Object.values(results.answers).filter(a => a === i).length; const pct = (count / (results.players.length || 1)) * 100; const isCorrect = i === results.correctIndex
              return (
                <div key={i} className={`rounded-2xl overflow-hidden transition-all duration-300 ${isCorrect ? 'ring-2 ring-emerald-500/50' : ''}`} style={{ backgroundColor: COLORS[i] + '15', border: `1px solid ${COLORS[i]}30` }}>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS[i] }}>{['A', 'B', 'C', 'D'][i]}</span>{isCorrect && <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">✓ Correcto</span>}</div>
                    <p className="text-white text-sm font-medium leading-snug line-clamp-2">{opt}</p>
                    <div className="w-full bg-white/[0.06] rounded-full h-2 overflow-hidden"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: COLORS[i] }} /></div>
                    <p className="text-white/40 text-xs">{count}/{results.players.length} ({Math.round(pct)}%)</p>
                  </div>
                </div>
              )
            })}</div>
            {sorted.length > 0 && (
              <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] overflow-hidden">
                <div className="p-4 border-b border-white/[0.06]"><h3 className="text-lg font-bold text-white">🏆 Tabla de posiciones</h3></div>
                <div className="divide-y divide-white/[0.04]">{sorted.slice(0, 5).map((p, i) => (
                  <div key={p.id} className={`flex items-center justify-between px-4 py-3 transition-all ${i === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-amber-500/5' : ''}`}>
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black ${i === 0 ? 'bg-yellow-500/20 text-yellow-400' : i === 1 ? 'bg-gray-300/20 text-gray-300' : i === 2 ? 'bg-amber-600/20 text-amber-500' : 'bg-white/[0.06] text-white/40'}`}>{i + 1}</span>
                      <AvatarDisplay avatar={p.avatar} /><span className="text-white font-semibold">{p.name}</span>
                    </div>
                    <span className="text-white font-black">{p.score.toLocaleString()}</span>
                  </div>
                ))}</div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={handleNextQuestion} className="px-8 py-3.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl font-bold text-white shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all">{questionIndex + 1 < questions.length ? '⏭ Siguiente pregunta' : '🏁 Resultados finales'}</button>
              <button onClick={handleEndGame} className="px-8 py-3.5 bg-white/[0.06] rounded-2xl font-bold text-red-400 hover:bg-white/[0.1] transition-all">Terminar juego</button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (phase === 'ended') {
    const sorted = [...players].sort((a, b) => b.score - a.score)
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#1a0a2e] flex items-center justify-center p-6 relative overflow-hidden">
        <div className={`relative z-10 text-center space-y-8 transition-all duration-700 ${fadeIn ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl border" style={{ background: `${themeColor}15`, borderColor: `${themeColor}30` }}><span className="text-6xl">🏆</span></div>
          <h1 className="text-5xl md:text-6xl font-black text-white">Game Over</h1>
          {sorted.length > 0 && <div className="max-w-md mx-auto space-y-6">
            <div className="flex justify-center gap-4">{sorted.slice(0, 3).map((p, i) => (
              <div key={p.id} className={`bg-white/[0.03] rounded-2xl p-5 border backdrop-blur-xl transition-all ${i === 0 ? 'border-yellow-500/30 bg-gradient-to-b from-yellow-500/10 to-transparent scale-110 shadow-lg shadow-yellow-500/10' : 'border-white/[0.06]'}`}>
                <div className="text-2xl mb-1">{['🥇', '🥈', '🥉'][i]}</div>
<div className="mb-1"><AvatarDisplay avatar={p.avatar} imgClass="w-10 h-10 rounded-full" /></div>
                <p className="text-white font-bold text-lg">{p.name}</p>
                <p className={`text-sm font-black ${i === 0 ? 'text-yellow-400' : 'text-white/50'}`}>{p.score.toLocaleString()} pts</p>
              </div>
            ))}</div>
          </div>}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={startOver} className="px-10 py-4 rounded-2xl font-bold text-lg text-white shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all" style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}AA)`, boxShadow: `0 0 30px ${themeColor}30` }}>Jugar de nuevo</button>
            <button onClick={onBack} className="px-10 py-4 bg-white/[0.06] rounded-2xl font-bold text-lg text-white/60 hover:bg-white/[0.1] hover:text-white transition-all">← Volver al lobby</button>
          </div>
        </div>
        <style>{`@keyframes float{0%,100%{transform:translateY(0)rotate(0)}50%{transform:translateY(-20px)rotate(180deg)}}`}</style>
      </div>
    )
  }

  return null
}
