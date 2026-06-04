import { useState, useEffect } from 'react'
import { getRandomArtist } from '../data/teamPlaylist'

export default function ArtistInfoView() {
  const [artist, setArtist] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    setArtist(getRandomArtist())
  }, [])

  const getNextArtist = () => {
    setArtist(getRandomArtist())
    setShowDetails(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col p-8">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-black text-white">Artist Info</h1>
        <p className="text-xl text-white/60">Learn about the artists</p>
      </div>

      {artist && (
        <div className="glass p-6 flex-1 flex-col space-y-6">
          <div className="relative">
            <img
              src={`https://i.scdn.co/image/ab6761610000e5eb${'a'.repeat(32)}`} // placeholder
              alt={artist.name}
              className="w-full h-48 object-cover rounded-2xl"
            />
            <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center">
              <div className="text-white/60 text-sm">Click for details</div>
            </div>
          </div>
          
          <div className="text-center py-4" onClick={() => setShowDetails(!showDetails)}>
            <h2 className="text-3xl font-bold text-white">{artist.name}</h2>
            <p className="text-white/40">{artist.nationality} • {artist.genre}</p>
          </div>

          {showDetails && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-white/60"><strong>Description:</strong> {artist.description}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-white/60"><strong>Popular Song:</strong> "{artist.popularSong}"</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-white/60"><strong>Concert Fact:</strong> "{artist.concertFact}"</p>
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <button onClick={getNextArtist} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-white transition-all">
              Next Artist →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
