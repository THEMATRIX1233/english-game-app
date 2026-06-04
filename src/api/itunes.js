const BASE_URL = 'https://itunes.apple.com/search'

const GENRES = [
  'pop', 'rock', 'hip hop', 'r&b', 'country',
  'edm', 'latin', 'jazz', 'reggae', 'indie',
  'metal', 'blues', 'folk', 'soul', 'disco',
  'punk', 'classical', 'alternative', 'rap', 'dance',
]

export async function searchSongs(term, limit = 50) {
  const url = `${BASE_URL}?term=${encodeURIComponent(term)}&limit=${limit}&entity=song`
  const res = await fetch(url)
  const data = await res.json()
  return data.results || []
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function getRandomSongs(count = 12) {
  const terms = shuffle(GENRES).slice(0, 3)
  const allSongs = []

  for (const term of terms) {
    try {
      const songs = await searchSongs(term, 25)
      allSongs.push(...songs.filter(s => s.previewUrl && s.trackName && s.artistName))
    } catch (e) {
      console.warn(`Failed to fetch ${term}:`, e)
    }
  }

  if (allSongs.length === 0) {
    const songs = await searchSongs('music', 50)
    allSongs.push(...songs.filter(s => s.previewUrl && s.trackName && s.artistName))
  }

  return shuffle(allSongs).slice(0, count)
}

export async function getSongByGenre(genre) {
  const songs = await searchSongs(genre, 25)
  return songs.filter(s => s.previewUrl && s.trackName && s.artistName)
}
