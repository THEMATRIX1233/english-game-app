export default function TeamView({ state }) {
  const isBlue = state.currentTeam === 'blue'
  const challenge = state.currentChallenge
  const modo = state.modo
  const reveal = state.revealAnswer || false

  const iconByModo = {
    'guess-song': '🎵',
    'guess-artist': '👤',
    'finish-lyrics': '📝',
    'sing-it': '🎙️',
  }
  const challengeIcon = iconByModo[modo] || '🎵'

  const modoLabel = {
    'guess-song': 'Guess the Song',
    'guess-artist': 'Guess the Artist',
  }[modo] || ''

  if (state.phase === 'menu' || state.phase === 'winner') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          {state.phase === 'winner' ? (
            <>
              <div className="text-8xl mb-6">{state.blueScore === state.redScore ? '🤝' : '🏆'}</div>
              <h1 className="text-5xl font-black text-white mb-4">
                {state.blueScore > state.redScore ? 'BLUE TEAM WINS!' :
                 state.redScore > state.blueScore ? 'RED TEAM WINS!' : "IT'S A TIE!"}
              </h1>
              <div className="flex justify-center gap-12 text-5xl font-black mt-4">
                <span className="text-blue-400">{state.blueScore}</span>
                <span className="text-white/30">-</span>
                <span className="text-red-400">{state.redScore}</span>
              </div>
            </>
          ) : (
            <>
              <div className="text-8xl mb-6">🎯</div>
              <h1 className="text-5xl font-black text-white">ENGLISH CHALLENGE</h1>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* TOP BAR */}
      <div className="bg-gray-900/80 backdrop-blur border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-5 h-5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
            <span className="font-bold text-blue-400 text-xl">BLUE</span>
            <span className="text-3xl font-black text-white">{state.blueScore}</span>
          </div>
          <div className="text-center">
            <span className="text-sm uppercase tracking-widest text-white/30">Round {state.round}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-3xl font-black text-white">{state.redScore}</span>
            <span className="font-bold text-red-400 text-xl">RED</span>
            <div className="w-5 h-5 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-8">
          {/* TEAM TURN */}
          <div className={`inline-flex items-center gap-4 px-8 py-3 rounded-full ${
            isBlue
              ? 'bg-blue-600/20 border-2 border-blue-500/40 text-blue-400'
              : 'bg-red-600/20 border-2 border-red-500/40 text-red-400'
          }`}>
            <div className={`w-4 h-4 rounded-full ${isBlue ? 'bg-blue-400 animate-pulse' : 'bg-red-400 animate-pulse'}`} />
            <span className="text-2xl font-black tracking-wider">
              {isBlue ? 'BLUE TEAM' : 'RED TEAM'}
            </span>
          </div>

          {state.phase === 'select' && (
            <div className="space-y-6">
              <div className="text-7xl">🎯</div>
              <p className="text-3xl text-white/50 font-light">Waiting for challenge...</p>
            </div>
          )}

          {state.phase === 'select-music' && (
            <div className="space-y-6">
              <div className="text-7xl animate-pulse">🎵</div>
              <p className="text-3xl text-white/50 font-light">Loading music...</p>
            </div>
          )}

          {state.phase === 'playing' && (
            <div className="space-y-8">
              {/* Challenge icon */}
              <div className="text-9xl animate-bounce-in">{challengeIcon}</div>

              {/* Mode name */}
              {modoLabel && (
                <div className="text-2xl text-white/40 font-light tracking-wider uppercase">
                  {modoLabel}
                </div>
              )}

              {/* HINT */}
              {state.challengeData?.currentHint && !reveal && (
                <div className="animate-slide-up">
                  <div className="inline-block px-8 py-4 bg-amber-500/15 border border-amber-500/30 rounded-2xl">
                    <p className="text-sm text-amber-400 uppercase tracking-widest mb-1">💡 Hint</p>
                    <p className="text-3xl font-bold text-amber-300">{state.challengeData.currentHint}</p>
                  </div>
                </div>
              )}

              {/* Revealed answer */}
              {reveal && state.challengeData?.revealedAnswer && (
                <div className="mt-8 animate-slide-up">
                  <div className="glass inline-block px-10 py-6 border-emerald-500/40">
                    <p className="text-sm text-emerald-400 uppercase tracking-widest mb-2">Answer</p>
                    <pre className="text-4xl font-black text-white whitespace-pre-wrap">
                      {state.challengeData.revealedAnswer}
                    </pre>
                  </div>
                </div>
              )}

              {/* Waiting dots */}
              {!reveal && (
                <div className="flex justify-center gap-2 mt-4">
                  <span className="w-3 h-3 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: '0s' }} />
                  <span className="w-3 h-3 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <span className="w-3 h-3 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
