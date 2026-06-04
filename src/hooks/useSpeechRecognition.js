import { useState, useCallback, useRef } from 'react'

export function useSpeechRecognition() {
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

  const startListening = useCallback((lang = 'en-US') => {
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser. Please use Chrome.')
      return
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    const recognition = new SpeechRecognition()
    recognition.lang = lang
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      const result = event.results[0][0].transcript
      setTranscript(result)
    }

    recognition.onerror = (event) => {
      setError(`Error: ${event.error}`)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
    setError(null)
    setTranscript('')
  }, [SpeechRecognition])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [])

  const calculateAccuracy = useCallback((spoken, original) => {
    const s = spoken.toLowerCase().trim()
    const o = original.toLowerCase().trim()
    if (!s || !o) return 0

    const spokenWords = s.split(/\s+/)
    const originalWords = o.split(/\s+/)
    let matches = 0

    originalWords.forEach((word, i) => {
      if (spokenWords[i] === word) matches++
    })

    return Math.round((matches / originalWords.length) * 100)
  }, [])

  return {
    transcript,
    isListening,
    error,
    startListening,
    stopListening,
    calculateAccuracy,
    isSupported: !!SpeechRecognition,
  }
}
