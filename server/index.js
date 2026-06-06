import express from 'express'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'

const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server })

const games = new Map()

app.get('/health', (req, res) => res.json({ ok: true, games: games.size }))

function generatePin() {
  return Math.random().toString(36).substring(2, 6).toUpperCase()
}

wss.on('connection', (ws) => {
  let playerId = null
  let gamePin = null
  let role = null

  ws.on('message', (raw) => {
    let data
    try { data = JSON.parse(raw) } catch { return }

    if (data.type === 'create_game') {
      const pin = generatePin()
      gamePin = pin
      role = 'teacher'
      playerId = `teacher_${Date.now()}`
      games.set(pin, {
        teacher: ws,
        players: new Map(),
        display: null,
        pin,
        createdAt: Date.now(),
      })
      ws.send(JSON.stringify({ type: 'created', pin, playerId }))
      return
    }

    if (data.type === 'join_game') {
      const game = games.get(data.pin)
      if (!game) {
        ws.send(JSON.stringify({ type: 'error', message: 'Game not found' }))
        return
      }
      gamePin = data.pin
      role = data.role || 'player'
      playerId = data.playerId || `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`

      if (role === 'display') {
        game.display = ws
        ws.send(JSON.stringify({ type: 'joined', playerId }))
        if (game.teacher) {
          game.teacher.send(JSON.stringify({ type: 'display_connected' }))
        }
      } else {
        game.players.set(playerId, { ws, name: data.name || '', avatar: data.avatar || '' })
        ws.send(JSON.stringify({ type: 'joined', playerId }))
        if (game.teacher) {
          game.teacher.send(JSON.stringify({
            type: 'player_joined',
            playerId,
            name: data.name || '',
            avatar: data.avatar || '',
          }))
        }
      }
      return
    }

    if (!gamePin || !games.has(gamePin)) {
      ws.send(JSON.stringify({ type: 'error', message: 'Not in a game' }))
      return
    }

    const game = games.get(gamePin)

    if (data.type === 'broadcast') {
      const recipients = data.to || 'all'
      if (recipients === 'all' || recipients === 'players') {
        game.players.forEach((p) => {
          try { p.ws.send(JSON.stringify(data.msg)) } catch {}
        })
      }
      if (recipients === 'all' || recipients === 'display') {
        if (game.display) {
          try { game.display.send(JSON.stringify(data.msg)) } catch {}
        }
      }
      if (recipients === 'all' || recipients === 'teacher') {
        if (game.teacher && ws !== game.teacher) {
          try { game.teacher.send(JSON.stringify(data.msg)) } catch {}
        }
      }
      return
    }

    if (data.type === 'send') {
      const { to, msg } = data
      if (to === 'teacher' && game.teacher) {
        try { game.teacher.send(JSON.stringify(msg)) } catch {}
      } else if (game.players.has(to)) {
        try { game.players.get(to).ws.send(JSON.stringify(msg)) } catch {}
      }
      return
    }

    if (data.type === 'get_players' && role === 'teacher') {
      const players = []
      game.players.forEach((p, id) => {
        players.push({ id, name: p.name, avatar: p.avatar })
      })
      ws.send(JSON.stringify({ type: 'players', players }))
      return
    }
  })

  ws.on('close', () => {
    if (gamePin && games.has(gamePin)) {
      const game = games.get(gamePin)
      if (role === 'teacher') {
        game.players.forEach(p => {
          try { p.ws.send(JSON.stringify({ type: 'teacher_disconnected' })); p.ws.close() } catch {}
        })
        if (game.display) {
          try { game.display.send(JSON.stringify({ type: 'teacher_disconnected' })); game.display.close() } catch {}
        }
        games.delete(gamePin)
      } else if (role === 'display') {
        game.display = null
        if (game.teacher) {
          try { game.teacher.send(JSON.stringify({ type: 'display_disconnected' })) } catch {}
        }
      } else if (playerId) {
        game.players.delete(playerId)
        if (game.teacher) {
          try { game.teacher.send(JSON.stringify({ type: 'player_left', playerId })) } catch {}
        }
      }
    }
  })
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
