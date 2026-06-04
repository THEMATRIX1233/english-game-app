import { popularSongs, enrichWithItunesData } from './popularSongs'
import { getLyrics } from '../api/lyricsOvh'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function generateSongQuestions(songs, count = 5) {
  const shuffled = shuffle(songs)
  const questions = []

  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const correct = shuffled[i]
    const others = shuffle(songs.filter(s => s.trackId !== correct.trackId))

    const options = shuffle([
      { text: correct.trackName, correct: true },
      ...others.slice(0, 3).map(s => ({ text: s.trackName, correct: false })),
    ])

    questions.push({
      type: 'guess-song',
      title: '🎵 Guess the Song',
      question: 'Listen to the preview. What song is this?',
      previewUrl: correct.previewUrl,
      artworkUrl: correct.artworkUrl100?.replace('100x100', '200x200'),
      options: options.map(o => o.text),
      correctIndex: options.findIndex(o => o.correct),
      correctAnswer: correct.trackName,
      artist: correct.artistName,
    })
  }

  return questions
}

export function generateArtistQuestions(songs, count = 5) {
  const shuffled = shuffle(songs)
  const questions = []

  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const correct = shuffled[i]
    const others = shuffle(songs.filter(s => s.artistName !== correct.artistName))

    const options = shuffle([
      { text: correct.artistName, correct: true },
      ...others.slice(0, 3).map(s => ({ text: s.artistName, correct: false })),
    ])

    questions.push({
      type: 'guess-artist',
      title: '👤 Guess the Artist',
      question: 'Listen to the preview. Who is the artist?',
      previewUrl: correct.previewUrl,
      artworkUrl: correct.artworkUrl100?.replace('100x100', '200x200'),
      options: options.map(o => o.text),
      correctIndex: options.findIndex(o => o.correct),
      correctAnswer: correct.artistName,
      song: correct.trackName,
    })
  }

  return questions
}

export function generateMixedQuestions(songs, count = 10) {
  const half = Math.ceil(count / 2)
  const songQ = generateSongQuestions(songs, half)
  const artistQ = generateArtistQuestions(songs, count - half)
  return shuffle([...songQ, ...artistQ])
}
