import { useState, useEffect, useRef, useCallback } from 'react'
import { getRandomSongs } from '../api/itunes'
import { getRandomLyricsChallenge } from '../api/lyricsOvh'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import AdminControls from './AdminControls'

const MODOS = [
  { id: 'guess-song', icon: '🎵', label: 'Guess the Song', desc: 'The song plays. Team guesses the title' },
  { id: 'guess-artist', icon: '👤', label: 'Guess the Artist', desc: 'The song plays with a silhouette. Who sings it?' },
  { id: 'finish-lyrics', icon: '📝', label: 'Finish the Lyrics', desc: 'Real lyrics with a missing word' },
  { id: 'sing-it', icon: '🎙️', label: 'Sing It!', desc: 'Sing the line & get scored by AI' },
]

function AudioPlayer({ previewUrl }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)

  const toggle = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setPlaying(false)
    } else {
      audioRef.current.play()
      setPlaying(true)
    }
  }

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const onEnd = () => setPlaying(false)
    el.addEventListener('ended', onEnd)
    return () => el.removeEventListener('ended', onEnd)
  }, [])

  return (
    <div className="flex flex-col items-center gap-3">
      <audio ref={audioRef} src={previewUrl} preload="auto" />
      <button
        onClick={toggle}
        className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl transition-all duration-200 ${
          playing
            ? 'bg-red-600 shadow-lg shadow-red-500/40 animate-pulse-fast'
            : 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 hover:scale-110'
        }`}
      >
        {playing ? '⏹' : '▶'}
      </button>
      <p className="text-sm text-white/40">{playing ? '🔊 Playing 30s preview...' : '▶ Teacher: click to play'}</p>
    </div>
  )
}

function SilhouetteImage({ url, children }) {
  return (
    <div className="relative flex justify-center">
      <div className="relative overflow-hidden rounded-2xl">
        <img
          src={url.replace('100x100', '300x300')}
          alt=""
          className="w-48 h-48 object-cover"
          style={{ filter: 'brightness(0) contrast(200%) drop-shadow(0 0 2px rgba(255,255,255,0.3))' }}
        />
      </div>
      {children}
    </div>
  )
}

export default function SongChallenge({ onComplete }) {
  const [modo, setModo] = useState(null)
  const [songs, setSongs] = useState([])
  const [currentSong, setCurrentSong] = useState(null)
  const [lyricsChallenge, setLyricsChallenge] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const pickSong = useCallback(async (songList, mode) => {
    const list = songList || songs
    if (list.length === 0) return
    const song = list[Math.floor(Math.random() * list.length)]
    setCurrentSong(song)
    setLyricsChallenge(null)

    if (mode === 'finish-lyrics' || mode === 'sing-it') {
      try {
        const challenge = await getRandomLyricsChallenge(song.artistName, song.trackName)
        if (challenge) {
          setLyricsChallenge(challenge)
        } else {
          const filtered = list.filter(s => s.trackId !== song.trackId)
          if (filtered.length > 0) pickSong(filtered, mode)
          return
        }
      } catch {
        const filtered = list.filter(s => s.trackId !== song.trackId)
        if (filtered.length > 0) pickSong(filtered, mode)
        return
      }
    }
    setLoading(false)
  }, [songs])

  const loadSongs = useCallback(async (selectedModo) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getRandomSongs(20)
      if (data.length === 0) throw new Error('No songs found')
      setSongs(data)
      await pickSong(data, selectedModo)
    } catch {
      setError('Could not load songs. Check internet.')
      setLoading(false)
    }
  }, [pickSong])

  const startModo = (m) => {
    setModo(m)
    loadSongs(m)
  }

  const handleCorrect = () => onComplete(true)
  const handleWrong = () => onComplete(false)
  const nextSong = () => pickSong(songs, modo)

  if (!modo) {
    return (
      <div className="card space-y-4">
        <h3 className="text-xl font-bold text-white">🎵 Music Challenge</h3>
        <p className="text-sm text-white/50">Pick a game mode:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MODOS.map(m => (
            <button key={m.id} onClick={() => startModo(m.id)} className="glass p-4 text-left hover:scale-[1.02] active:scale-95 transition-all duration-200">
              <div className="text-3xl mb-2">{m.icon}</div>
              <div className="font-bold text-white">{m.label}</div>
              <div className="text-sm text-white/50">{m.desc}</div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="card text-center py-12">
        <div className="text-4xl mb-4 animate-pulse">🎵</div>
        <p className="text-white/60">Loading songs from iTunes...</p>
        <div className="mt-4 w-32 h-1 mx-auto bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="card text-center py-8">
        <p className="text-red-400 mb-2">{error}</p>
        <button onClick={() => loadSongs(modo)} className="btn-primary">Retry</button>
        <button onClick={() => setModo(null)} className="btn-ghost ml-3">Back</button>
      </div>
    )
  }

  if (!currentSong) return null

  const modoInfo = MODOS.find(m => m.id === modo)
  const isGuessArtist = modo === 'guess-artist'
  const isGuessSong = modo === 'guess-song'
  const isLyrics = modo === 'finish-lyrics'
  const isSing = modo === 'sing-it'

  const teamView = (
    <div className="space-y-6">
      {/* Album art */}
      <div className="flex justify-center">
        {isGuessArtist ? (
          <SilhouetteImage url={currentSong.artworkUrl100} />
        ) : (
          <img
            src={currentSong.artworkUrl100?.replace('100x100', '300x300')}
            alt=""
            className="w-48 h-48 rounded-2xl shadow-2xl object-cover"
          />
        )}
      </div>

      {/* Audio player */}
      <AudioPlayer previewUrl={currentSong.previewUrl} />

      {/* Challenge type specific content */}
      {isGuessSong && (
        <div className="text-center">
          <p className="text-lg text-white/80 font-medium">🎵 What song is this?</p>
          <p className="text-sm text-white/30 mt-1">Listen carefully to the preview</p>
        </div>
      )}

      {isGuessArtist && (
        <div className="text-center">
          <p className="text-lg text-white/80 font-medium">👤 Who is the artist?</p>
          <p className="text-sm text-white/30 mt-1">The silhouette gives you a hint...</p>
        </div>
      )}

      {isLyrics && lyricsChallenge && (
        <div className="glass rounded-xl p-5">
          <p className="text-xs text-amber-400 mb-2">📝 Complete the missing word:</p>
          <pre className="text-lg text-white/90 font-sans leading-relaxed whitespace-pre-wrap">
            {lyricsChallenge.preview}
          </pre>
        </div>
      )}

      {isSing && lyricsChallenge && (
        <div className="glass rounded-xl p-5 text-center">
          <p className="text-xs text-emerald-400 mb-2">🎤 Sing this line:</p>
          <p className="text-xl text-white font-semibold">"{lyricsChallenge.fullLine}"</p>
        </div>
      )}
    </div>
  )

  // Admin answer
  let adminAnswer = ''
  if (isGuessSong) adminAnswer = `🎵 ${currentSong.trackName}\n👤 ${currentSong.artistName}`
  else if (isGuessArtist) adminAnswer = `👤 ${currentSong.artistName}`
  else if (isLyrics && lyricsChallenge) adminAnswer = `📝 "${lyricsChallenge.answer}" — from "${currentSong.trackName}" by ${currentSong.artistName}`
  else if (isSing && lyricsChallenge) adminAnswer = `🎤 ${currentSong.trackName} — ${currentSong.artistName}`

  return (
    <div className="card space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">{modoInfo.icon} {modoInfo.label}</h3>
          <p className="text-sm text-white/50">{modoInfo.desc}</p>
        </div>
        <button onClick={() => setModo(null)} className="btn-ghost text-sm">↩ Back</button>
      </div>

      {/* TEAM VIEW */}
      {teamView}

      {/* ADMIN CONTROLS */}
      <AdminControls
        answer={adminAnswer}
        onCorrect={handleCorrect}
        onWrong={handleWrong}
      >
        {isSing && <SingAdminPanel song={currentSong} />}
      </AdminControls>

      <button onClick={nextSong} className="btn-ghost w-full text-white/40 text-sm">
        Skip → Next Song
      </button>
    </div>
  )
}

function SingAdminPanel({ song }) {
  const { transcript, isListening, startListening, stopListening, calculateAccuracy, isSupported } = useSpeechRecognition()
  const [result, setResult] = useState(null)
  const scoredRef = useRef(false)

  const handleStart = () => {
    scoredRef.current = false
    setResult(null)
    startListening()
  }

  useEffect(() => {
    if (transcript && !isListening && !scoredRef.current) {
      scoredRef.current = true
      setResult({ spoken: transcript, accuracy: calculateAccuracy(transcript, '') })
    }
  }, [transcript, isListening, calculateAccuracy])

  if (!isSupported) {
    return <p className="text-yellow-400 text-sm">Speech rec not available. Use Chrome.</p>
  }

  return (
    <div className="space-y-3 mt-2">
      <p className="text-xs text-white/40">🎤 Speech Recognition (optional):</p>
      <div className="flex gap-2">
        {!isListening ? (
          <button onClick={handleStart} className="btn-ghost text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            Test Mic
          </button>
        ) : (
          <button onClick={() => stopListening()} className="px-3 py-1.5 bg-red-600 rounded-lg text-white text-sm animate-pulse-fast">
            Listening...
          </button>
        )}
      </div>
    </div>
  )
}
