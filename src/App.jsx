import { useEffect, useState } from 'react'
import TeacherPanel from './components/TeacherPanel'
import GameView from './components/GameView'
import PlayerView from './components/PlayerView'
import Lobby from './components/Lobby'
import ArtistTeacherPanel from './components/ArtistTeacherPanel'

export default function App() {
  const [view, setView] = useState(null)
  const [artistId, setArtistId] = useState(null)

  useEffect(() => {
    const detect = () => {
      const hash = window.location.hash
      const teacherMatch = hash.match(/^#teacher\/([a-zA-Z0-9_+]+)$/)
      if (hash === '#teacher') { setView('teacher'); setArtistId(null) }
      else if (hash === '#game') { setView('game'); setArtistId(null) }
      else if (hash === '#play') { setView('play'); setArtistId(null) }
      else if (teacherMatch) {
        setView('artist-teacher')
        setArtistId(teacherMatch[1])
      }
      else if (hash === '#lobby' || hash === '' || hash === '#') { setView('lobby'); setArtistId(null) }
      else setView('lobby')
    }
    detect()
    window.addEventListener('hashchange', detect)
    return () => window.removeEventListener('hashchange', detect)
  }, [])

  const handleEnterTeacherMode = (studentId) => {
    window.location.hash = `#teacher/${studentId}`
  }

  const handleBackToLobby = () => {
    window.location.hash = '#lobby'
  }

  if (view === 'artist-teacher' && artistId) {
    return <ArtistTeacherPanel studentId={artistId} onBack={handleBackToLobby} />
  }

  if (view === 'lobby') {
    return <Lobby onEnterTeacherMode={handleEnterTeacherMode} />
  }

  if (view === 'landing' || view === null) {
    return <Lobby onEnterTeacherMode={handleEnterTeacherMode} />
  }

  if (view === 'teacher') return <TeacherPanel />
  if (view === 'game') return <GameView />
  if (view === 'play') return <PlayerView />

  return null
}
