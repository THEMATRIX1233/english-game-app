import { useState } from 'react'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { speaking } from '../data/challenges'
import AdminControls from './AdminControls'

export default function SpeakingChallenge({ onComplete }) {
  const [currentPhrase, setCurrentPhrase] = useState(speaking[Math.floor(Math.random() * speaking.length)])

  const { transcript, isListening, startListening, stopListening, isSupported } = useSpeechRecognition()

  const getNewPhrase = () => {
    const next = speaking[Math.floor(Math.random() * speaking.length)]
    setCurrentPhrase(next)
  }

  const handleCorrect = () => onComplete(true)
  const handleWrong = () => onComplete(false)

  if (!isSupported) {
    return (
      <div className="card space-y-4">
        <h3 className="text-xl font-bold text-white">🎤 Speaking Challenge</h3>
        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 text-yellow-400">
          Speech recognition not supported. Use Chrome.
        </div>
        <AdminControls
          answer={`Phrase: "${currentPhrase.phrase}"`}
          onCorrect={handleCorrect}
          onWrong={handleWrong}
        />
        <button onClick={getNewPhrase} className="btn-ghost w-full text-white/40 text-sm">
          Skip → Next
        </button>
      </div>
    )
  }

  return (
    <div className="card space-y-5">
      <div>
        <h3 className="text-xl font-bold text-white">🎤 Speaking Challenge</h3>
        <p className="text-sm text-white/50">Read the phrase aloud in English</p>
      </div>

      {/* TEAM VIEW */}
      <div className="glass rounded-xl p-6 text-center">
        <div className="text-xs text-white/40 mb-2">
          Difficulty:{' '}
          <span className={`font-semibold ${
            currentPhrase.difficulty === 'Easy' ? 'text-emerald-400' :
            currentPhrase.difficulty === 'Medium' ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {currentPhrase.difficulty}
          </span>
        </div>
        <p className="text-2xl font-bold text-white leading-relaxed">
          "{currentPhrase.phrase}"
        </p>
      </div>

      {/* MIC TEST */}
      <div className="flex justify-center">
        {!isListening ? (
          <button
            onClick={() => startListening()}
            className="btn-primary flex items-center gap-2 py-3 px-6"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            🎤 Test Mic
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="px-6 py-3 bg-red-600 rounded-xl font-semibold text-white animate-pulse-fast flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-white" />
              Listening...
            </div>
            <button onClick={() => stopListening()} className="btn-ghost">
              Stop
            </button>
          </div>
        )}
      </div>

      {transcript && !isListening && (
        <div className="glass rounded-xl p-4 animate-slide-up text-center">
          <p className="text-xs text-white/40 mb-1">Detected:</p>
          <p className="text-lg text-white font-medium">"{transcript}"</p>
        </div>
      )}

      {/* ADMIN CONTROLS */}
      <AdminControls
        answer={`Expected: "${currentPhrase.phrase}"${transcript ? `\nDetected: "${transcript}"` : ''}`}
        onCorrect={handleCorrect}
        onWrong={handleWrong}
      />

      <button onClick={getNewPhrase} className="btn-ghost w-full text-white/40 text-sm">
        Skip → Next Phrase
      </button>
    </div>
  )
}
