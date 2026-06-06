const KNOWN_PREVIEWS = {}

export const popularSongs = [
  { trackName: "Du hast", artistName: "Rammstein", album: "Sehnsucht", previewUrl: null, artworkUrl100: null },
  { trackName: "Radio", artistName: "Rammstein", album: "Rammstein", previewUrl: null, artworkUrl100: null },
  { trackName: "Ausländer", artistName: "Rammstein", album: "Rammstein", previewUrl: null, artworkUrl100: null },
  { trackName: "Sonne", artistName: "Rammstein", album: "Mutter", previewUrl: null, artworkUrl100: null },
  { trackName: "As It Was", artistName: "Harry Styles", album: "Harry's House", previewUrl: null, artworkUrl100: null },
  { trackName: "Watermelon Sugar", artistName: "Harry Styles", album: "Fine Line", previewUrl: null, artworkUrl100: null },
  { trackName: "Sign of the Times", artistName: "Harry Styles", album: "Harry Styles", previewUrl: null, artworkUrl100: null },
  { trackName: "Mentiste", artistName: "Cazzu", album: "Error 93", previewUrl: null, artworkUrl100: null },
  { trackName: "R.i.p", artistName: "Cazzu", album: "Maldade$", previewUrl: null, artworkUrl100: null },
  { trackName: "Mucha Data", artistName: "Cazzu", album: "Una Niña Inútil", previewUrl: null, artworkUrl100: null },
  { trackName: "Lady Blue", artistName: "Bunbury", album: "Flamingos", previewUrl: null, artworkUrl100: null },
  { trackName: "El jinete", artistName: "Bunbury", album: "Canciones 96-06", previewUrl: null, artworkUrl100: null },
  { trackName: "La chispa adecuada", artistName: "Bunbury", album: "MTV Unplugged", previewUrl: null, artworkUrl100: null },
  { trackName: "SLOW DANCING IN THE DARK", artistName: "Joji", album: "BALLADS 1", previewUrl: null, artworkUrl100: null },
  { trackName: "Before The Day Is Over", artistName: "Joji", album: "SMITHEREENS", previewUrl: null, artworkUrl100: null },
  { trackName: "Glimpse of Us", artistName: "Joji", album: "SMITHEREENS", previewUrl: null, artworkUrl100: null },
  { trackName: "Sorry", artistName: "Justin Bieber", album: "Purpose", previewUrl: null, artworkUrl100: null },
  { trackName: "Love Yourself", artistName: "Justin Bieber", album: "Purpose", previewUrl: null, artworkUrl100: null },
  { trackName: "Baby", artistName: "Justin Bieber", album: "My World 2.0", previewUrl: null, artworkUrl100: null },
  { trackName: "PARIS", artistName: "Junior H", album: "$AD BOYZ 4 LIFE II", previewUrl: null, artworkUrl100: null },
  { trackName: "MILES DE ROSAS", artistName: "Junior H", album: "$AD BOYZ 4 LIFE II", previewUrl: null, artworkUrl100: null },
  { trackName: "M3&M4", artistName: "Junior H", album: "DEPR</3$$ED MFKZ", previewUrl: null, artworkUrl100: null },
  { trackName: "Blinding Lights", artistName: "The Weeknd", album: "After Hours", previewUrl: null, artworkUrl100: null },
  { trackName: "Save Your Tears", artistName: "The Weeknd", album: "After Hours", previewUrl: null, artworkUrl100: null },
  { trackName: "Starboy", artistName: "The Weeknd", album: "Starboy", previewUrl: null, artworkUrl100: null },
  { trackName: "Hands To Myself", artistName: "Selena Gomez", album: "Revival", previewUrl: null, artworkUrl100: null },
  { trackName: "Good For You", artistName: "Selena Gomez", album: "Revival", previewUrl: null, artworkUrl100: null },
  { trackName: "Love You Like A Love Song", artistName: "Selena Gomez", album: "When the Sun Goes Down", previewUrl: null, artworkUrl100: null },
]

export async function enrichWithItunesData(song) {
  const cacheKey = `${song.artistName}::${song.trackName}`
  if (KNOWN_PREVIEWS[cacheKey]) return KNOWN_PREVIEWS[cacheKey]

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(song.trackName + ' ' + song.artistName)}&limit=1&entity=song&country=us`
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)
    const data = await res.json()
    if (data.results?.[0]?.previewUrl) {
      const r = data.results[0]
      const enriched = {
        ...song,
        previewUrl: r.previewUrl,
        artworkUrl100: r.artworkUrl100,
        primaryGenreName: r.primaryGenreName,
        trackId: r.trackId || cacheKey,
      }
      KNOWN_PREVIEWS[cacheKey] = enriched
      return enriched
    }
  } catch {}
  return song
}

export async function getPopularSongWithPreview() {
  const shuffled = [...popularSongs].sort(() => Math.random() - 0.5)
  for (const song of shuffled) {
    const enriched = await enrichWithItunesData(song)
    if (enriched.previewUrl) return enriched
  }
  return null
}

export async function getMultiplePopularSongs(count = 10) {
  const shuffled = [...popularSongs].sort(() => Math.random() - 0.5)
  const withPreview = []
  const withoutPreview = []
  for (const song of shuffled) {
    if (withPreview.length >= count) break
    const enriched = await enrichWithItunesData(song)
    if (enriched.previewUrl) {
      withPreview.push(enriched)
    } else {
      withoutPreview.push({ ...enriched, trackId: enriched.trackId || enriched.trackName })
    }
  }
  const fillNeeded = Math.min(count - withPreview.length, withoutPreview.length)
  const fallback = withoutPreview.slice(0, fillNeeded)
  return [...withPreview, ...fallback].slice(0, count)
}
