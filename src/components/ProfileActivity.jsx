import { useState, useEffect, useCallback } from 'react'
import { getStudentById, defaultAvatars } from '../data/profiles'
import AvatarDisplay from './AvatarDisplay'
import { getQuestionsForStudent, getArtistNameForStudent } from '../data/artistQuestions'
import { teamArtists } from '../data/teamPlaylist'
import { getRandomQuestion } from '../data/teamData'

const TABS = [
  { key: 'questions', label: 'Preguntas', icon: '❓' },
  { key: 'grammar', label: 'Gramática', icon: '📝' },
  { key: 'pairs', label: 'Parejas', icon: '👥' },
  { key: 'info', label: 'Info Artista', icon: 'ℹ️' },
]

const COLORS = ['#E74C3C', '#3498DB', '#F1C40F', '#2ECC71']
const COLOR_NAMES = ['red', 'blue', 'yellow', 'green']

export default function ProfileActivity({ studentId, onBack }) {
  const student = getStudentById(studentId)
  const artist = teamArtists.find(a => a.name === student?.artist)
  const questions = getQuestionsForStudent(studentId)

  const [activeTab, setActiveTab] = useState('info')
  const [playerName, setPlayerName] = useState('')
  const [avatar, setAvatar] = useState(defaultAvatars[0]?.src || '')
  const [joined, setJoined] = useState(false)
  const [participants, setParticipants] = useState([])
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showResult, setShowResult] = useState(false)
  const [grammarQuestions, setGrammarQuestions] = useState([])
  const [grammarIndex, setGrammarIndex] = useState(0)
  const [grammarAnswer, setGrammarAnswer] = useState(null)
  const [showGrammarResult, setShowGrammarResult] = useState(false)
  const [pairs, setPairs] = useState([])
  const [fadeIn, setFadeIn] = useState(true)

  const storageKey = `activity_${studentId}`

  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setParticipants(data.participants || [])
        setPairs(data.pairs || [])
      } catch {}
    }
    const savedName = localStorage.getItem(`${storageKey}_name`)
    const savedAvatar = localStorage.getItem(`${storageKey}_avatar`)
    if (savedName) {
      setPlayerName(savedName)
      setAvatar(savedAvatar || defaultAvatars[0]?.src || '')
      setJoined(true)
    }
    const gqs = []
    for (let i = 0; i < 5; i++) {
      gqs.push(getRandomQuestion())
    }
    setGrammarQuestions(gqs)
  }, [])

  useEffect(() => {
    if (joined && playerName) {
      localStorage.setItem(`${storageKey}_name`, playerName)
      localStorage.setItem(`${storageKey}_avatar`, avatar)
    }
  }, [joined, playerName, avatar])

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ participants, pairs }))
  }, [participants, pairs])

  const handleJoin = () => {
    if (!playerName.trim()) return
    const exists = participants.find(p => p.name.toLowerCase() === playerName.trim().toLowerCase())
    if (!exists) {
      setParticipants(prev => [...prev, { name: playerName.trim(), avatar: avatar || getDefaultEmoji(studentId), joinedAt: Date.now() }])
    }
    setJoined(true)
  }

  const removeParticipant = (name) => {
    setParticipants(prev => prev.filter(p => p.name !== name))
    setPairs([])
  }

  const generatePairs = () => {
    const shuffled = [...participants].sort(() => Math.random() - 0.5)
    const newPairs = []
    for (let i = 0; i < shuffled.length; i += 2) {
      if (i + 1 < shuffled.length) {
        newPairs.push([shuffled[i], shuffled[i + 1]])
      } else {
        newPairs.push([shuffled[i]])
      }
    }
    setPairs(newPairs)
  }

  const handleAnswer = (index) => {
    if (answers[currentQIndex] !== undefined) return
    setAnswers(prev => ({ ...prev, [currentQIndex]: index }))
  }

  const nextQuestion = () => {
    setShowResult(false)
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1)
    }
  }

  const checkGrammar = (index) => {
    setGrammarAnswer(index)
    setShowGrammarResult(true)
  }

  const nextGrammar = () => {
    setGrammarAnswer(null)
    setShowGrammarResult(false)
    if (grammarIndex < grammarQuestions.length - 1) {
      setGrammarIndex(prev => prev + 1)
    }
  }

  const shareUrl = `${window.location.origin}/#activity/${studentId}`

  const copyShareLink = () => {
    navigator.clipboard?.writeText(shareUrl)
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#1a0a2e] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <span className="text-6xl">❌</span>
          <h2 className="text-2xl font-bold text-white">Perfil no encontrado</h2>
          <button onClick={onBack} className="px-6 py-3 bg-white/[0.06] rounded-xl text-white hover:bg-white/[0.1] transition-all">
            Volver al lobby
          </button>
        </div>
      </div>
    )
  }

  if (!joined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#1a0a2e] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="particle"
              style={{
                left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
                width: `${Math.random() * 3 + 1}px`, height: `${Math.random() * 3 + 1}px`,
                animation: `float ${Math.random() * 8 + 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`,
                background: `rgba(255,255,255,${Math.random() * 0.1})`,
              }}
            />
          ))}
        </div>
        <div className="relative z-10 w-full max-w-md space-y-6">
          <button onClick={onBack} className="text-white/30 hover:text-white/60 text-sm flex items-center gap-2 transition-all">
            ← Volver al lobby
          </button>

          <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-8 text-center space-y-6 shadow-2xl">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br mx-auto flex items-center justify-center text-5xl border-2 border-white/10"
              style={{ background: `linear-gradient(135deg, ${student.color}30, ${student.color}10)` }}>
              <AvatarDisplay avatar={avatar || getDefaultEmoji(studentId)} className="text-5xl" imgClass="w-24 h-24 rounded-3xl" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">{student.name}</h1>
              <p className="text-white/50 mt-1">
                Artista: <span className="font-semibold" style={{ color: student.color }}>{student.artist}</span>
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs uppercase tracking-widest text-white/30 font-semibold mb-2 block">
                  Tu nombre
                </label>
                <input value={playerName} onChange={e => setPlayerName(e.target.value)}
                  placeholder="Escribe tu nombre"
                  className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/50 transition-all placeholder:text-white/20"
                  maxLength={20}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()} />
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-white/30 font-semibold mb-2 block">
                  Tu avatar
                </label>
                <div className="flex flex-wrap justify-center gap-2">
                  {defaultAvatars.map(a => {
                    const val = a.src || a.emoji
                    return (
                      <button key={val} onClick={() => setAvatar(val)}
                        className={`w-24 h-24 rounded-2xl flex items-center justify-center transition-all duration-200 overflow-hidden ${
                          avatar === val
                            ? 'bg-purple-500/30 border-2 border-purple-400 scale-110'
                            : 'bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1]'
                        }`}
                        title={a.label}>
                        {a.emoji ? <span className="text-lg">{a.emoji}</span> : <img src={a.src} alt={a.label} className="w-full h-full object-cover" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              <button onClick={handleJoin} disabled={!playerName.trim()}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl font-bold text-white text-lg shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed">
                Entrar a mi actividad
              </button>
            </div>
          </div>
        </div>
        <style>{`@keyframes float { 0%,100%{transform:translateY(0)rotate(0)} 50%{transform:translateY(-15px)rotate(180deg)} }`}</style>
      </div>
    )
  }

  const currentQ = questions[currentQIndex]
  const isCorrect = answers[currentQIndex] === currentQ?.correctIndex
  const allDone = Object.keys(answers).length >= questions.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#1a0a2e] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="particle"
            style={{
              left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`, height: `${Math.random() * 3 + 1}px`,
              animation: `float2 ${Math.random() * 10 + 5}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 6}s`,
              background: `rgba(255,255,255,${Math.random() * 0.08})`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-4">
        <header className="flex items-center justify-between mb-6 bg-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-white/30 hover:text-white/60 text-sm transition-all">
              ←
            </button>
            <AvatarDisplay avatar={avatar || getDefaultEmoji(studentId)} className="text-3xl" imgClass="w-10 h-10 rounded-full" />
            <div>
              <h2 className="text-white font-bold text-lg">{student.name}</h2>
              <p className="text-white/40 text-xs">
                Artista: <span style={{ color: student.color }} className="font-semibold">{student.artist}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={copyShareLink}
              className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] rounded-xl text-white/60 text-sm hover:bg-white/[0.1] hover:text-white transition-all border border-white/[0.06]">
              <span>🔗</span>
              Compartir
            </button>
            <span className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.06] rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-white/50">{participants.length} participantes</span>
            </span>
          </div>
        </header>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setFadeIn(false); setTimeout(() => setFadeIn(true), 50) }}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-white/[0.08] text-white border border-white/[0.12]'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/[0.03] border border-transparent'
              }`}>
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className={`transition-all duration-300 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* === INFO TAB === */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-8 text-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br mx-auto flex items-center justify-center text-6xl border-4 border-white/10 mb-6"
                  style={{ background: `linear-gradient(135deg, ${student.color}40, ${student.color}10)` }}>
                  🎤
                </div>
                <h2 className="text-4xl font-black text-white mb-2">{artist?.name || student.artist}</h2>
                {artist && (
                  <>
                    <p className="text-white/50 text-lg mb-4">{artist.nationality} · {artist.genre}</p>
                    <p className="text-white/70 max-w-xl mx-auto leading-relaxed">{artist.description}</p>
                    <div className="mt-6 bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] max-w-md mx-auto">
                      <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Canción popular</p>
                      <p className="text-white font-bold text-lg">"{artist.popularSong}"</p>
                    </div>
                    <div className="mt-4 bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] max-w-md mx-auto">
                      <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Dato curioso</p>
                      <p className="text-white/70">{artist.concertFact}</p>
                    </div>
                  </>
                )}
              </div>
              {questions.length > 0 && (
                <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-6">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <span>❓</span> Preguntas disponibles ({questions.length})
                  </h3>
                  <div className="grid gap-2">
                    {questions.map((q, i) => (
                      <div key={q.id} className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06] flex items-center justify-between">
                        <span className="text-white/70 text-sm">{i + 1}. {q.question}</span>
                        <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${
                          answers[i] !== undefined
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-white/[0.06] text-white/30'
                        }`}>
                          {answers[i] !== undefined ? '✓' : 'pendiente'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* === QUESTIONS TAB === */}
          {activeTab === 'questions' && (
            <div className="max-w-2xl mx-auto space-y-6">
              {questions.length === 0 ? (
                <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-12 text-center">
                  <span className="text-5xl mb-4 block">📋</span>
                  <h3 className="text-xl font-bold text-white mb-2">Preguntas pendientes</h3>
                  <p className="text-white/50">Las preguntas para este artista serán agregadas pronto.</p>
                </div>
              ) : allDone && !currentQ ? (
                <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-12 text-center">
                  <span className="text-6xl mb-4 block">🎉</span>
                  <h3 className="text-2xl font-bold text-white mb-2">¡Todas las preguntas completadas!</h3>
                  <p className="text-white/50">Has respondido todas las preguntas de {student.artist}.</p>
                  <button onClick={() => { setCurrentQIndex(0); setAnswers({}); setShowResult(false) }}
                    className="mt-6 px-6 py-3 bg-white/[0.08] rounded-xl text-white hover:bg-white/[0.12] transition-all">
                    Volver a empezar
                  </button>
                </div>
              ) : currentQ && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/40 font-semibold uppercase tracking-wider">
                      Pregunta {currentQIndex + 1} de {questions.length}
                    </span>
                    <span className="text-sm text-white/30">{currentQ.category?.replace(/-/g, ' ')}</span>
                  </div>

                  <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-8">
                    <h2 className="text-2xl font-black text-white leading-tight mb-8">
                      {currentQ.question}
                    </h2>

                    <div className="grid grid-cols-1 gap-3">
                      {currentQ.options.map((opt, i) => {
                        const selected = answers[currentQIndex] === i
                        const revealed = showResult || answers[currentQIndex] !== undefined
                        const isCorrectOpt = i === currentQ.correctIndex
                        let bgColor = COLORS[i] + '20'
                        let borderColor = COLORS[i] + '40'
                        if (revealed && isCorrectOpt) {
                          bgColor = '#10B98130'
                          borderColor = '#10B981'
                        } else if (revealed && selected && !isCorrectOpt) {
                          bgColor = '#EF444430'
                          borderColor = '#EF4444'
                        } else if (selected) {
                          borderColor = '#FFFFFF'
                        }

                        return (
                          <button key={i} onClick={() => handleAnswer(i)}
                            disabled={answers[currentQIndex] !== undefined}
                            className="w-full text-left py-4 px-5 rounded-2xl font-medium text-white transition-all duration-200 border"
                            style={{
                              backgroundColor: bgColor,
                              borderColor: borderColor,
                              opacity: revealed && !isCorrectOpt && !selected ? 0.4 : 1,
                              transform: selected ? 'scale(1.01)' : undefined,
                            }}>
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-sm font-black mr-3"
                              style={{ backgroundColor: COLORS[i] + '40', color: COLORS[i] }}>
                              {['A', 'B', 'C', 'D'][i]}
                            </span>
                            {opt}
                            {revealed && isCorrectOpt && <span className="float-right text-emerald-400">✓</span>}
                            {revealed && selected && !isCorrectOpt && <span className="float-right text-red-400">✗</span>}
                          </button>
                        )
                      })}
                    </div>

                    {answers[currentQIndex] !== undefined && !showResult && (
                      <div className="mt-6 text-center">
                        <button onClick={() => setShowResult(true)}
                          className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-bold text-white shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all">
                          Ver resultado
                        </button>
                      </div>
                    )}

                    {showResult && (
                      <div className={`mt-6 p-5 rounded-2xl border text-center ${
                        isCorrect
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-red-500/10 border-red-500/30'
                      }`}>
                        <span className="text-4xl block mb-2">{isCorrect ? '✅' : '❌'}</span>
                        <p className={`text-xl font-bold ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isCorrect ? '¡Correcto!' : 'Incorrecto'}
                        </p>
                        <p className="text-white/50 text-sm mt-1">Respuesta correcta: {currentQ.options[currentQ.correctIndex]}</p>
                        {currentQIndex < questions.length - 1 && (
                          <button onClick={nextQuestion}
                            className="mt-4 px-6 py-2.5 bg-white/[0.08] rounded-xl text-white hover:bg-white/[0.12] transition-all font-semibold">
                            Siguiente pregunta →
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center gap-2">
                    {questions.map((_, i) => (
                      <button key={i} onClick={() => { setCurrentQIndex(i); setShowResult(false) }}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                          answers[i] !== undefined
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : currentQIndex === i
                              ? 'bg-white/[0.1] text-white border border-white/20'
                              : 'bg-white/[0.04] text-white/30 border border-white/[0.06] hover:bg-white/[0.08]'
                        }`}>
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* === GRAMMAR TAB === */}
          {activeTab === 'grammar' && (
            <div className="max-w-2xl mx-auto space-y-6">
              {grammarQuestions.length === 0 ? (
                <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-12 text-center">
                  <span className="text-5xl mb-4 block">📝</span>
                  <h3 className="text-xl font-bold text-white">Cargando ejercicios...</h3>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/40 font-semibold uppercase tracking-wider">
                      Ejercicio {grammarIndex + 1} de {grammarQuestions.length}
                    </span>
                    <span className="text-sm text-white/30">{grammarQuestions[grammarIndex]?.type?.replace(/-/g, ' ')}</span>
                  </div>

                  <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-8">
                    <h2 className="text-xl font-black text-white mb-2">{grammarQuestions[grammarIndex]?.title}</h2>
                    <p className="text-white/50 mb-6">{grammarQuestions[grammarIndex]?.question}</p>

                    <p className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-8">
                      "{grammarQuestions[grammarIndex]?.prompt}"
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      {grammarQuestions[grammarIndex]?.options.map((opt, i) => {
                        const selected = grammarAnswer === i
                        const revealed = showGrammarResult
                        const isCorrectOpt = i === grammarQuestions[grammarIndex]?.correctIndex
                        let bgColor = COLORS[i] + '20'
                        let borderColor = COLORS[i] + '40'
                        if (revealed && isCorrectOpt) {
                          bgColor = '#10B98130'
                          borderColor = '#10B981'
                        } else if (revealed && selected && !isCorrectOpt) {
                          bgColor = '#EF444430'
                          borderColor = '#EF4444'
                        } else if (selected) {
                          borderColor = '#FFFFFF'
                        }

                        return (
                          <button key={i} onClick={() => !showGrammarResult && checkGrammar(i)}
                            disabled={showGrammarResult}
                            className="py-4 px-5 rounded-2xl font-medium text-white transition-all duration-200 border text-center"
                            style={{
                              backgroundColor: bgColor,
                              borderColor: borderColor,
                              opacity: revealed && !isCorrectOpt && !selected ? 0.4 : 1,
                            }}>
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-sm font-black mr-2"
                              style={{ backgroundColor: COLORS[i] + '40' }}>
                              {['A', 'B', 'C', 'D'][i]}
                            </span>
                            {opt}
                            {revealed && isCorrectOpt && <span className="ml-2 text-emerald-400">✓</span>}
                            {revealed && selected && !isCorrectOpt && <span className="ml-2 text-red-400">✗</span>}
                          </button>
                        )
                      })}
                    </div>

                    {showGrammarResult && (
                      <div className="mt-6 text-center space-y-3">
                        <p className={`text-lg font-bold ${grammarAnswer === grammarQuestions[grammarIndex]?.correctIndex ? 'text-emerald-400' : 'text-red-400'}`}>
                          {grammarAnswer === grammarQuestions[grammarIndex]?.correctIndex ? '✅ ¡Correcto!' : '❌ Incorrecto'}
                        </p>
                        {grammarQuestions[grammarIndex]?.explanation && (
                          <p className="text-white/50 text-sm">{grammarQuestions[grammarIndex].explanation}</p>
                        )}
                        <button onClick={nextGrammar}
                          className="px-6 py-2.5 bg-white/[0.08] rounded-xl text-white hover:bg-white/[0.12] transition-all font-semibold">
                          {grammarIndex < grammarQuestions.length - 1 ? 'Siguiente →' : 'Reiniciar'}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* === PAIRS TAB === */}
          {activeTab === 'pairs' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <span>👥</span> Participantes
                  </h3>
                  <span className="text-white/40 text-sm">{participants.length} personas</span>
                </div>

                {participants.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {participants.map((p, i) => (
                      <div key={p.name} className="inline-flex items-center gap-2 px-3 py-2 bg-white/[0.06] rounded-xl border border-white/[0.06]">
                        <AvatarDisplay avatar={p.avatar} className="text-lg" imgClass="w-6 h-6 rounded-full" />
                        <span className="text-white text-sm font-medium">{p.name}</span>
                        <button onClick={() => removeParticipant(p.name)}
                          className="text-white/20 hover:text-red-400 transition-all text-xs ml-1">✕</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/30 text-center py-4">No hay participantes aún. Comparte el enlace para que se unan.</p>
                )}

                <div className="flex gap-2">
                  <input value={playerName} onChange={e => setPlayerName(e.target.value)}
                    placeholder="Nombre del participante"
                    className="flex-1 bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-purple-500/50 transition-all placeholder:text-white/20"
                    onKeyDown={e => e.key === 'Enter' && handleJoin()} />
                  <button onClick={handleJoin} disabled={!playerName.trim()}
                    className="px-4 py-2.5 bg-white/[0.08] rounded-xl text-white text-sm font-semibold hover:bg-white/[0.12] transition-all disabled:opacity-40">
                    + Agregar
                  </button>
                </div>
              </div>

              <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <span>🔀</span> Parejas aleatorias
                  </h3>
                  <button onClick={generatePairs} disabled={participants.length < 2}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white text-sm font-semibold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                    Generar parejas
                  </button>
                </div>

                {pairs.length > 0 ? (
                  <div className="grid gap-3">
                    {pairs.map((pair, i) => (
                      <div key={i} className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
                        <div className="flex items-center justify-center gap-4">
                          {pair.map((p, j) => (
                            <div key={p.name} className="flex items-center gap-2">
                              <AvatarDisplay avatar={p.avatar} className="text-2xl" imgClass="w-8 h-8 rounded-full" />
                              <span className="text-white font-semibold">{p.name}</span>
                              {j < pair.length - 1 && <span className="text-white/20 mx-2">⟷</span>}
                            </div>
                          ))}
                        </div>
                        <p className="text-center text-white/30 text-xs mt-2">Pareja {i + 1}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <span className="text-5xl block mb-3">🔀</span>
                    <p className="text-white/50">Haz clic en "Generar parejas" para crear pares aleatorios</p>
                    {participants.length < 2 && (
                      <p className="text-white/30 text-sm mt-2">Necesitas al menos 2 participantes</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes float2 { 0%,100%{transform:translateY(0)rotate(0)} 50%{transform:translateY(-20px)rotate(180deg)} }`}</style>
    </div>
  )
}

function getDefaultEmoji(id) {
  const map = {
    vanesa: '🎤', uriel: '🎧', paloma: '🎵',
    jareth: '🎸', yahir: '🔥', fernanda: '✨', diego: '⚡',
  }
  return map[id] || '👤'
}
