export const popularSongs = [
  { trackName: "Radio", artistName: "Rammstein", album: "Rammstein", previewUrl: null, artworkUrl100: null },
  { trackName: "Du hast", artistName: "Rammstein", album: "Sehnsucht (Remastered)", previewUrl: null, artworkUrl100: null },
  { trackName: "Sign of the Times", artistName: "Harry Styles", album: "Harry Styles", previewUrl: null, artworkUrl100: null },
  { trackName: "As It Was", artistName: "Harry Styles", album: "Harry's House", previewUrl: null, artworkUrl100: null },
  { trackName: "Watermelon Sugar", artistName: "Harry Styles", album: "Fine Line", previewUrl: null, artworkUrl100: null },
  { trackName: "Du riechst so gut", artistName: "Rammstein", album: "Herzeleid (Remastered)", previewUrl: null, artworkUrl100: null },
  { trackName: "Mentiste", artistName: "Cazzu", album: "Error 93", previewUrl: null, artworkUrl100: null },
  { trackName: "Ausländer", artistName: "Rammstein", album: "Rammstein", previewUrl: null, artworkUrl100: null },
  { trackName: "R.i.p", artistName: "Cazzu", album: "Maldade$", previewUrl: null, artworkUrl100: null },
  { trackName: "Dicke Titten", artistName: "Rammstein", album: "Zeit", previewUrl: null, artworkUrl100: null },
  { trackName: "Lady Blue", artistName: "Bunbury", album: "Flamingos", previewUrl: null, artworkUrl100: null },
  { trackName: "El jinete", artistName: "Bunbury", album: "Canciones 96-06", previewUrl: null, artworkUrl100: null },
  { trackName: "La chispa adecuada", artistName: "Bunbury", album: "MTV Unplugged. El Lib...", previewUrl: null, artworkUrl100: null },
  { trackName: "Before The Day Is Over", artistName: "Joji", album: "SMITHEREENS", previewUrl: null, artworkUrl100: null },
  { trackName: "SLOW DANCING IN THE DARK", artistName: "Joji", album: "BALLADS 1", previewUrl: null, artworkUrl100: null },
  { trackName: "After House", artistName: "C.R.O", album: "After House", previewUrl: null, artworkUrl100: null },
  { trackName: "Past Won't Leave My Bed", artistName: "Joji", album: "Past Won't Leave My B...", previewUrl: null, artworkUrl100: null },
  { trackName: "Engel", artistName: "Rammstein", album: "Sehnsucht", previewUrl: null, artworkUrl100: null },
  { trackName: "PARIS", artistName: "Junior H", album: "$AD BOYZ 4 LIFE II", previewUrl: null, artworkUrl100: null },
  { trackName: "M3&M4", artistName: "Junior H", album: "DEPR</3$$ED MFKZ", previewUrl: null, artworkUrl100: null },
  { trackName: "MILES DE ROSAS", artistName: "Junior H", album: "$AD BOYZ 4 LIFE II", previewUrl: null, artworkUrl100: null },
  { trackName: "MI$ LLAMADA$", artistName: "Junior H", album: "DEPR</3$$ED MFKZ", previewUrl: null, artworkUrl100: null },
  { trackName: "MIENTRAS DUERMES", artistName: "Junior H", album: "$AD BOYZ 4 LIFE II", previewUrl: null, artworkUrl100: null },
  { trackName: "Blinding Lights", artistName: "The Weeknd", album: "After Hours", previewUrl: null, artworkUrl100: null },
  { trackName: "Hands To Myself", artistName: "Selena Gomez", album: "Revival", previewUrl: null, artworkUrl100: null },
  { trackName: "Good For You", artistName: "Selena Gomez", album: "Revival", previewUrl: null, artworkUrl100: null },
  { trackName: "Love You Like A Love Song", artistName: "Selena Gomez", album: "When the Sun Goes Down", previewUrl: null, artworkUrl100: null },
  { trackName: "Save Your Tears", artistName: "The Weeknd", album: "After Hours", previewUrl: null, artworkUrl100: null },
  { trackName: "Starboy", artistName: "The Weeknd", album: "Starboy", previewUrl: null, artworkUrl100: null },
  { trackName: "Sorry", artistName: "Justin Bieber", album: "Purpose", previewUrl: null, artworkUrl100: null },
  { trackName: "Love Yourself", artistName: "Justin Bieber", album: "Purpose", previewUrl: null, artworkUrl100: null },
  { trackName: "Baby", artistName: "Justin Bieber", album: "My World 2.0", previewUrl: null, artworkUrl100: null },
]

export async function enrichWithItunesData(song) {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(song.trackName + ' ' + song.artistName)}&limit=1&entity=song`
    const res = await fetch(url)
    const data = await res.json()
    if (data.results?.[0]?.previewUrl) {
      const r = data.results[0]
      return {
        ...song,
        previewUrl: r.previewUrl,
        artworkUrl100: r.artworkUrl100,
        primaryGenreName: r.primaryGenreName,
        trackId: r.trackId,
      }
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
  const results = []
  for (const song of shuffled.slice(0, count * 2)) {
    if (results.length >= count) break
    const enriched = await enrichWithItunesData(song)
    if (enriched.previewUrl) {
      results.push(enriched)
    }
  }
  return results
}
