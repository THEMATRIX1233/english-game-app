import { useState, useEffect, useRef } from 'react'
import { students, defaultAvatars } from '../data/profiles'
import { getQuestionsForStudent } from '../data/artistQuestions'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function Lobby({ onEnterTeacherMode }) {
  const [hoveredId, setHoveredId] = useState(null)
  const [mode, setMode] = useState('individual')
  const [pairs, setPairs] = useState([])
  const [selected, setSelected] = useState([])

  const storageKey = 'lobby_pairs'

  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try { setPairs(JSON.parse(saved)) } catch {}
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(pairs))
  }, [pairs])

  const bgAudioRef = useRef(null)

  useEffect(() => {
    const audio = new Audio('https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/72/fd/e0/72fde090-4913-f65e-edc4-f488f1c52ee8/mzaf_8965793460077282531.plus.aac.p.m4a')
    audio.loop = true
    audio.volume = 0.1
    bgAudioRef.current = audio
    audio.play().catch(() => {})
    const handleInteraction = () => {
      audio.play().catch(() => {})
      document.removeEventListener('click', handleInteraction)
    }
    document.addEventListener('click', handleInteraction, { once: true })
    return () => {
      audio.pause()
      audio.src = ''
      document.removeEventListener('click', handleInteraction)
    }
  }, [])

  const formPairs = () => {
    const shuffled = shuffle(students.filter(s => s.artist !== 'Pendiente'))
    const newPairs = []
    for (let i = 0; i < shuffled.length; i += 2) {
      if (i + 1 < shuffled.length) {
        newPairs.push([shuffled[i], shuffled[i + 1]])
      } else {
        newPairs.push([shuffled[i]])
      }
    }
    setPairs(newPairs)
    setMode('pairs')
    setSelected([])
  }

  const clearPairs = () => {
    setPairs([])
    setMode('individual')
  }

  const toggleSelect = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const openPairTeacher = (pair) => {
    if (pair.length === 2) {
      onEnterTeacherMode(`${pair[0].id}+${pair[1].id}`)
    } else {
      onEnterTeacherMode(pair[0].id)
    }
  }

  const totalQuestions = (id) => getQuestionsForStudent(id).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#1a0a2e] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div key={i} className="particle"
            style={{
              left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
              width: `${Math.random() * 4 + 2}px`, height: `${Math.random() * 4 + 2}px`,
              animation: `float ${Math.random() * 12 + 6}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 8}s`,
              background: `rgba(255,255,255,${Math.random() * 0.12})`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-rose-500/20 border border-white/10 mb-4">
            <span className="text-4xl">🎯</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            English Challenge
          </h1>
          <p className="text-white/40 text-lg mt-2 font-light">
            Kahoot por parejas — cada pareja presenta su artista
          </p>
        </div>

        {/* Mode switcher */}
        <div className="flex justify-center gap-3 mb-8">
          <button onClick={() => { setMode('individual'); setSelected([]) }}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              mode === 'individual'
                ? 'bg-white/[0.08] text-white border border-white/[0.12]'
                : 'text-white/40 hover:text-white/60 bg-white/[0.02] border border-transparent'
            }`}>
            👤 Individual
          </button>
          <button onClick={() => { if (pairs.length > 0) setMode('pairs'); else formPairs() }}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              mode === 'pairs'
                ? 'bg-white/[0.08] text-white border border-white/[0.12]'
                : 'text-white/40 hover:text-white/60 bg-white/[0.02] border border-transparent'
            }`}>
            👫 Parejas {pairs.length > 0 && `(${pairs.length})`}
          </button>
        </div>

        {/* Pairs mode */}
        {mode === 'pairs' && (
          <div className="space-y-6">
            <div className="flex justify-center gap-3">
              <button onClick={formPairs}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-bold text-white shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all">
                🔀 Formar parejas aleatorias
              </button>
              <button onClick={clearPairs}
                className="px-6 py-3 bg-white/[0.06] rounded-xl text-white/60 hover:bg-white/[0.1] hover:text-white transition-all">
                Limpiar
              </button>
            </div>

            {pairs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                {pairs.map((pair, idx) => (
                  <button key={idx} onClick={() => openPairTeacher(pair)}
                    className="group bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-6 text-center transition-all duration-300 hover:scale-[1.02] active:scale-[0.97] hover:shadow-2xl"
                    style={{
                      borderColor: pair.length === 2
                        ? `${pair[0].color}40`
                        : undefined,
                    }}>
                    <div className="flex items-center justify-center gap-4 mb-4">
                      {pair.map((p, j) => (
                        <div key={p.id} className="flex flex-col items-center gap-2">
                          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border border-white/[0.08] transition-all group-hover:-translate-y-1"
                            style={{ background: `${p.color}20`, borderColor: `${p.color}40` }}>
                            🎤
                          </div>
                          <span className="text-white font-bold">{p.name}</span>
                          <span className="text-white/40 text-xs">{p.artist}</span>
                        </div>
                      ))}
                    </div>
                    {pair.length === 2 ? (
                      <div className="flex items-center justify-center gap-2 text-white/50 text-sm">
                        <span className="text-xs">{totalQuestions(pair[0].id)} preguntas</span>
                        <span className="text-white/20">+</span>
                        <span className="text-xs">{totalQuestions(pair[1].id)} preguntas</span>
                        <span className="ml-2 text-emerald-400 text-xs font-semibold">Kahoot →</span>
                      </div>
                    ) : (
                      <div className="text-white/30 text-xs">Sin pareja</div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white/[0.02] rounded-2xl border border-white/[0.06] max-w-md mx-auto">
                <span className="text-6xl block mb-4">👫</span>
                <p className="text-white/50">Presiona "Formar parejas aleatorias"</p>
                <p className="text-white/30 text-sm mt-2">Se crearán 4 parejas al azar</p>
              </div>
            )}
          </div>
        )}

        {/* Individual mode */}
        {mode === 'individual' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {students.map((student, idx) => (
                <div key={student.id}
                  onMouseEnter={() => setHoveredId(student.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="group relative"
                  style={{ animationDelay: `${idx * 80}ms` }}>
                  <button
                    onClick={() => onEnterTeacherMode(student.id)}
                    className={`w-full text-left bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-5 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] ${
                      hoveredId === student.id ? 'shadow-2xl' : ''
                    }`}
                    style={{
                      borderColor: hoveredId === student.id ? student.color + '60' : undefined,
                      boxShadow: hoveredId === student.id ? `0 0 30px ${student.color}20` : undefined,
                    }}>
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08] flex items-center justify-center text-4xl transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1"
                        style={{ borderColor: hoveredId === student.id ? student.color + '40' : undefined }}>
                        🎤
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">{student.name}</h3>
                        <p className="text-white/40 text-xs mt-0.5">
                          <span className="font-semibold" style={{ color: student.color }}>{student.artist}</span>
                        </p>
                        {student.artist !== 'Pendiente' ? (
                          <span className="inline-block mt-2 text-[10px] uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                            {totalQuestions(student.id)} preguntas · Kahoot
                          </span>
                        ) : (
                          <span className="inline-block mt-2 text-[10px] uppercase tracking-wider bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-semibold">
                            Pendiente
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <button onClick={formPairs}
                className="px-8 py-4 bg-white/[0.04] hover:bg-white/[0.08] rounded-2xl border border-white/[0.08] text-white/60 hover:text-white transition-all">
                👫 ¿Trabajar por parejas? Formar grupos →
              </button>
            </div>
          </>
        )}

        <div className="mt-8 text-center">
          <h3 className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-3">¿Cómo funciona?</h3>
          <div className="inline-flex flex-wrap justify-center gap-2 text-xs text-white/30">
            <span className="px-3 py-1.5 bg-white/[0.03] rounded-lg">1. Formar parejas o elegir individual</span>
            <span className="px-3 py-1.5 bg-white/[0.03] rounded-lg">2. Abrir el Kahoot de cada pareja</span>
            <span className="px-3 py-1.5 bg-white/[0.03] rounded-lg">3. Compartir el PIN con la clase</span>
            <span className="px-3 py-1.5 bg-white/[0.03] rounded-lg">4. Responden en sus celulares</span>
          </div>
        </div>
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
