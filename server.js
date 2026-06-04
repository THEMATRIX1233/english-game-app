import express from 'express'
import http from 'http'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { Server } from 'socket.io'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
})

const PORT = process.env.PORT || 3001

// Serve static frontend (built by vite)
const distPath = path.join(__dirname, 'dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  // SPA fallback - serve index.html for all non-API routes
  app.use((req, res, next) => {
    if (req.path.startsWith('/socket.io')) return next()
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) next()
    })
  })
} else {
  console.log('⚠️  dist/ folder not found. Run: npm run build')
}

let game = {
  phase: 'lobby', players: [], currentQuestion: null, currentQuestionIndex: -1,
  questionStartTime: null, questionTimeLimit: 30, answers: {}, scores: {}, questions: [], pin: '',
}

function generatePin() {
  return Math.random().toString(36).substring(2, 6).toUpperCase()
}

io.on('connection', (socket) => {
  console.log(`Connected: ${socket.id}`)

  socket.on('join-view', (view) => {
    if (view === 'teacher') socket.join('teacher')
    else if (view === 'game') socket.join('game')
  })

  socket.on('teacher:start-game', (questions) => {
    game = { phase: 'lobby', players: [], currentQuestion: null, currentQuestionIndex: -1, questionStartTime: null, questionTimeLimit: 30, answers: {}, scores: {}, questions, pin: generatePin() }
    socket.join('teacher')
    socket.emit('teacher:game-created', { pin: game.pin })
    console.log(`Game created. PIN: ${game.pin}`)
  })

  socket.on('teacher:next-question', () => {
    game.currentQuestionIndex++
    if (game.currentQuestionIndex >= game.questions.length) {
      game.phase = 'finished'
      io.emit('game:finished', { scores: game.scores, players: game.players })
      io.to('teacher').emit('teacher:game-ended')
      return
    }
    game.currentQuestion = game.questions[game.currentQuestionIndex]
    game.answers = {}; game.phase = 'playing'; game.questionStartTime = Date.now()
    io.to('players').emit('player:question', { question: game.currentQuestion, timeLimit: game.questionTimeLimit })
    io.to('game').emit('game:question', { question: game.currentQuestion, timeLimit: game.questionTimeLimit, playerCount: game.players.length })
    io.to('teacher').emit('teacher:question-started', { question: game.currentQuestion, questionIndex: game.currentQuestionIndex, totalQuestions: game.questions.length, playerCount: game.players.length })
  })

  socket.on('teacher:show-results', () => {
    const correctIdx = game.currentQuestion.correctIndex
    Object.entries(game.answers).forEach(([playerId, answerIdx]) => {
      if (answerIdx === correctIdx) {
        game.scores[playerId] = (game.scores[playerId] || 0) + 1000 + Math.max(0, Math.floor((game.questionTimeLimit - (Date.now() - game.questionStartTime) / 1000))) * 10
      }
    })
    game.phase = 'results'
    io.to('game').emit('game:results', { answers: game.answers, correctIndex: correctIdx, players: game.players.map(p => ({ ...p, score: game.scores[p.id] || 0 })) })
    io.to('teacher').emit('teacher:results', { answers: game.answers, correctIndex: correctIdx, players: game.players.map(p => ({ ...p, score: game.scores[p.id] || 0 })) })
  })

  socket.on('teacher:end-game', () => {
    game.phase = 'finished'
    io.emit('game:finished', { scores: game.scores, players: game.players })
    io.to('teacher').emit('teacher:game-ended')
  })

  socket.on('player:join', ({ name, pin, avatar }) => {
    if (pin !== game.pin || game.phase !== 'lobby') {
      socket.emit('player:join-error', 'PIN inválido')
      return
    }
    const player = { id: socket.id, name, avatar: avatar || '🦸', score: 0 }
    game.players.push(player)
    socket.join('players')
    socket.emit('player:joined', { playerId: socket.id, players: game.players })
    io.to('teacher').emit('teacher:player-joined', game.players)
    io.to('game').emit('game:players-update', game.players)
  })

  socket.on('player:answer', ({ answerIndex }) => {
    if (game.phase !== 'playing' || game.answers[socket.id]) return
    game.answers[socket.id] = answerIndex
    socket.emit('player:answer-confirmed')
    io.to('teacher').emit('teacher:answer-count', Object.keys(game.answers).length)
    io.to('game').emit('game:answer-count', { count: Object.keys(game.answers).length, total: game.players.length })
    if (Object.keys(game.answers).length >= game.players.length) {
      io.to('teacher').emit('teacher:all-answered')
    }
  })

  socket.on('disconnect', () => {
    const idx = game.players.findIndex(p => p.id === socket.id)
    if (idx !== -1) {
      game.players.splice(idx, 1)
      io.to('teacher').emit('teacher:player-joined', game.players)
      io.to('game').emit('game:players-update', game.players)
    }
  })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`)
})
