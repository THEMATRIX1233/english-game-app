const BASE_URL = 'https://api.lyrics.ovh/v1'

export async function getLyrics(artist, title) {
  try {
    const res = await fetch(
      `${BASE_URL}/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.lyrics || null
  } catch {
    return null
  }
}

export function extractChallenge(lyrics) {
  const lines = lyrics.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 3 && !l.match(/^[0-9\s]*$/) && !l.match(/^(verse|chorus|bridge|intro|outro)/i))

  if (lines.length < 6) return null

  const start = Math.floor(Math.random() * Math.max(1, lines.length - 6))
  const chunk = lines.slice(start, start + 6)

  const blankIndex = Math.floor(Math.random() * chunk.length)
  const blankLine = chunk[blankIndex]
  const words = blankLine.split(/\s+/)

  if (words.length < 3) return null

  const wordIndex = Math.floor(words.length / 2)
  const blankWord = words[wordIndex].replace(/[^a-zA-Z'-]/g, '')
  words[wordIndex] = '______'
  chunk[blankIndex] = words.join(' ')

  return {
    preview: chunk.join('\n'),
    answer: blankWord.toLowerCase(),
    fullLine: blankLine,
  }
}

export async function getRandomLyricsChallenge(artist, title) {
  const lyrics = await getLyrics(artist, title)
  if (!lyrics) return null
  return extractChallenge(lyrics)
}
