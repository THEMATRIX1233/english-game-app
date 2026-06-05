export const students = [
  {
    id: 'vanesa',
    name: 'Vanesa',
    artist: 'Harry Styles',
    artistId: 2,
    color: '#FF6B9D',
    gradient: 'from-pink-500 to-rose-500',
    bgGradient: 'from-pink-900/40 to-rose-900/30',
  },
  {
    id: 'uriel',
    name: 'Uriel',
    artist: 'Joji',
    artistId: 5,
    color: '#6C63FF',
    gradient: 'from-indigo-500 to-purple-500',
    bgGradient: 'from-indigo-900/40 to-purple-900/30',
  },
  {
    id: 'paloma',
    name: 'Paloma',
    artist: 'Cazzu',
    artistId: 3,
    color: '#00D68F',
    gradient: 'from-emerald-500 to-teal-500',
    bgGradient: 'from-emerald-900/40 to-teal-900/30',
  },
  {
    id: 'jareth',
    name: 'Jareth',
    artist: 'Bunbury',
    artistId: 4,
    color: '#FF8C42',
    gradient: 'from-orange-500 to-amber-500',
    bgGradient: 'from-orange-900/40 to-amber-900/30',
  },
  {
    id: 'yahir',
    name: 'Yahir',
    artist: 'Rammstein',
    artistId: 1,
    color: '#FF4757',
    gradient: 'from-red-500 to-rose-600',
    bgGradient: 'from-red-900/40 to-rose-900/30',
  },
  {
    id: 'fernanda',
    name: 'Fernanda',
    artist: 'C.R.O',
    artistId: 6,
    color: '#54A0FF',
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-900/40 to-cyan-900/30',
  },
  {
    id: 'diego',
    name: 'Diego',
    artist: 'Junior H',
    artistId: 7,
    color: '#2ED573',
    gradient: 'from-green-500 to-lime-500',
    bgGradient: 'from-green-900/40 to-lime-900/30',
  },
  {
    id: 'andresito',
    name: 'Andresito',
    artist: 'The Weeknd',
    artistId: 9,
    color: '#C084FC',
    gradient: 'from-purple-400 to-violet-500',
    bgGradient: 'from-purple-900/40 to-violet-900/30',
  },
  {
    id: 'araceli',
    name: 'Araceli',
    artist: 'Selena Gomez',
    artistId: 10,
    color: '#FF69B4',
    gradient: 'from-pink-400 to-rose-500',
    bgGradient: 'from-pink-900/40 to-rose-900/30',
  },
]

export const defaultAvatars = [
  { src: '/avatars/SMO.png', label: 'SMO' },
  { src: '/avatars/Gemini_Generated_Image_ryvr27ryvr27ryvr.png', label: 'Star' },
  { src: '/avatars/Gemini_Generated_Image_t1phe6t1phe6t1ph.png', label: 'Flame' },
]

export function getDefaultEmoji(id) {
  const map = {
    vanesa: '🎤', uriel: '🎧', paloma: '🎵',
    jareth: '🎸', yahir: '🔥', fernanda: '✨', diego: '⚡',
    andresito: '🌟', araceli: '💖',
  }
  return map[id] || '👤'
}

export function getStudentById(id) {
  return students.find(s => s.id === id) || null
}
