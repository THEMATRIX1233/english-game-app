import { useState } from 'react'
import { words } from '../data/challenges'
import AdminControls from './AdminControls'

export default function WordChallenge({ onComplete }) {
  const [currentWord, setCurrentWord] = useState(words[Math.floor(Math.random() * words.length)])
  const [showDefinition, setShowDefinition] = useState(false)

  const getNewWord = () => {
    const next = words[Math.floor(Math.random() * words.length)]
    setCurrentWord(next)
    setShowDefinition(false)
  }

  const handleCorrect = () => onComplete(true)
  const handleWrong = () => onComplete(false)

  const adminAnswer = `Word: ${currentWord.word}\nCategory: ${currentWord.category}\nDefinition: ${currentWord.definition}\nExample: ${currentWord.example}`

  return (
    <div className="card space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">📚 Word Challenge</h3>
          <p className="text-sm text-white/50">Learn and use new vocabulary!</p>
        </div>
      </div>

      {/* TEAM VIEW */}
      <div className="text-center py-8">
        <div className="text-xs text-white/40 mb-2 uppercase tracking-widest">
          {currentWord.category}
        </div>
        <div className="text-5xl font-black text-white mb-2 tracking-tight">
          {currentWord.word}
        </div>
        <p className="text-sm text-white/50 mt-4">
          The team must create a correct sentence using this word
        </p>
      </div>

      <div className="flex justify-center gap-2">
        <button
          onClick={() => setShowDefinition(!showDefinition)}
          className="btn-ghost text-sm"
        >
          {showDefinition ? 'Hide' : 'Show'} Definition
        </button>
      </div>

      {showDefinition && (
        <div className="animate-slide-up space-y-3">
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
            <div className="text-xs text-blue-400 mb-1">Definition</div>
            <p className="text-white">{currentWord.definition}</p>
          </div>
          <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-3">
            <div className="text-xs text-purple-400 mb-1">Example</div>
            <p className="text-white/90">{currentWord.example}</p>
          </div>
        </div>
      )}

      {/* ADMIN CONTROLS */}
      <AdminControls
        answer={adminAnswer}
        onCorrect={handleCorrect}
        onWrong={handleWrong}
      />

      <button onClick={getNewWord} className="btn-ghost w-full text-white/40 text-sm">
        Skip → Next Word
      </button>
    </div>
  )
}
