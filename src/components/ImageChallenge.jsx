import { useState, useCallback } from 'react'
import { images } from '../data/challenges'
import AdminControls from './AdminControls'

export default function ImageChallenge({ onComplete }) {
  const [currentImage, setCurrentImage] = useState(images[Math.floor(Math.random() * images.length)])
  const [questionIndex, setQuestionIndex] = useState(0)

  const getNewImage = () => {
    const next = images[Math.floor(Math.random() * images.length)]
    setCurrentImage(next)
    setQuestionIndex(0)
  }

  const handleCorrect = useCallback(() => {
    if (questionIndex < currentImage.questions.length - 1) {
      setQuestionIndex(prev => prev + 1)
    } else {
      onComplete(true)
    }
  }, [questionIndex, currentImage.questions.length, onComplete])

  const handleWrong = useCallback(() => {
    onComplete(false)
  }, [onComplete])

  const adminAnswer = `Title: ${currentImage.title}\nDescription: ${currentImage.description}\nQuestion ${questionIndex + 1}: ${currentImage.questions[questionIndex]}`

  return (
    <div className="card space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">🖼️ Image Challenge</h3>
          <p className="text-sm text-white/50">Describe the image in English</p>
        </div>
        <div className="flex items-center gap-1 text-white/40 text-sm">
          {currentImage.questions.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i <= questionIndex ? 'bg-purple-500' : 'bg-white/20'}`} />
          ))}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden bg-gray-900">
        <img
          src={currentImage.url}
          alt=""
          className="w-full h-64 object-cover hover:scale-105 transition-transform duration-500"
        />
      </div>

      <div className="text-center">
        <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4 animate-slide-up">
          <div className="text-xs text-purple-400 mb-1">Question {questionIndex + 1} of {currentImage.questions.length}</div>
          <p className="text-white font-medium">{currentImage.questions[questionIndex]}</p>
        </div>
      </div>

      <AdminControls
        answer={adminAnswer}
        onCorrect={handleCorrect}
        onWrong={handleWrong}
      />

      <button onClick={getNewImage} className="btn-ghost w-full text-white/40 text-sm">
        Skip → Next Image
      </button>
    </div>
  )
}
