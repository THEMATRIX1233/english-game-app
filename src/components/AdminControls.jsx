import { useState } from 'react'

export default function AdminControls({ answer, children, onCorrect, onWrong }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
          open
            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            : 'bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/60 border border-white/10'
        }`}
      >
        <span>{open ? '🔓' : '🔒'}</span>
        {open ? 'Teacher Panel Open' : '👤 Teacher Controls (click to open)'}
      </button>

      {open && (
        <div className="mt-3 glass p-5 border-yellow-500/30 animate-slide-up space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-yellow-400 font-semibold">🔑 Answer Key</span>
          </div>

          {answer && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <p className="text-yellow-400 font-bold text-lg">{answer}</p>
            </div>
          )}

          {children}

          <div className="flex gap-3 pt-2">
            <button onClick={onCorrect} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-white transition-all active:scale-95">
              ✓ CORRECT — {1} point
            </button>
            <button onClick={onWrong} className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold text-white transition-all active:scale-95">
              ✗ WRONG
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
