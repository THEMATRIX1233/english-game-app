const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'wss://english-game-server.onrender.com'

export function generatePin() {
  return Math.random().toString(36).substring(2, 6).toUpperCase()
}

function connectWebSocket() {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), 15000)
    const ws = new WebSocket(SERVER_URL)
    ws.onopen = () => { clearTimeout(t); resolve(ws) }
    ws.onerror = () => { clearTimeout(t); reject(new Error('connection failed')) }
  })
}

// ===== HOST (Teacher's browser) =====

export async function createHost() {
  const ws = await connectWebSocket()
  ws.send(JSON.stringify({ type: 'create_game' }))
  const host = { ws, pin: null, playerId: null, connections: new Map(), displayConn: null, listeners: [] }
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), 15000)
    ws.onmessage = (e) => {
      let data
      try { data = JSON.parse(e.data) } catch { return }
      if (data.type === 'created') {
        clearTimeout(t)
        host.pin = data.pin
        host.playerId = data.playerId
        resolve(host)
        host.listeners.forEach(l => l(data))
      } else if (data.type === 'player_joined') {
        const info = { playerId: data.playerId, name: data.name, avatar: data.avatar }
        host.connections.set(data.playerId, info)
        host.listeners.forEach(l => l(data))
      } else if (data.type === 'player_left') {
        host.connections.delete(data.playerId)
        host.listeners.forEach(l => l(data))
      } else if (data.type === 'display_connected') {
        host.displayConn = { id: 'display' }
        host.listeners.forEach(l => l(data))
      } else if (data.type === 'display_disconnected') {
        host.displayConn = null
        host.listeners.forEach(l => l(data))
      } else {
        host.listeners.forEach(l => l(data))
      }
    }
    ws.onclose = () => {
      host.listeners.forEach(l => l({ type: 'disconnected' }))
    }
    ws.onerror = () => {
      reject(new Error('connection error'))
    }
  })
}

export function onHostConnection(host, cb) {
  const listener = (data) => {
    if (data.type === 'player_joined') {
      const info = {
        playerId: data.playerId,
        name: data.name,
        avatar: data.avatar,
      }
      cb(null, info, { type: 'join', playerId: data.playerId, name: data.name, avatar: data.avatar })
    } else if (data.type === 'player_left') {
      cb(null, { playerId: data.playerId }, { type: 'leave', playerId: data.playerId })
    }
  }
  host.listeners.push(listener)
  return () => {
    host.listeners = host.listeners.filter(l => l !== listener)
  }
}

export function hostSend(target, data) {
  if (target && target.ws && target.ws.readyState === WebSocket.OPEN) {
    target.ws.send(JSON.stringify({ type: 'send', to: target.playerId || 'teacher', msg: data }))
  }
}

export function hostBroadcast(host, data) {
  if (host.ws.readyState === WebSocket.OPEN) {
    host.ws.send(JSON.stringify({ type: 'broadcast', to: 'all', msg: data }))
  }
}

export function hostBroadcastAll(host, data) {
  hostBroadcast(host, data)
}

export function destroyHost(host) {
  try { host.ws.close() } catch {}
}

// ===== CLIENT (Student / Display browser) =====

export async function connectToHost(pin, role = 'player', playerName = '', playerAvatar = '') {
  const ws = await connectWebSocket()
  const playerId = `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const client = { ws, id: playerId, conn: ws, pin }
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), 15000)
    let resolved = false
    ws.onmessage = (e) => {
      let data
      try { data = JSON.parse(e.data) } catch { return }
      if (data.type === 'joined' && !resolved) {
        resolved = true
        clearTimeout(t)
        client.id = data.playerId || playerId
        resolve(client)
      } else if (data.type === 'error' && !resolved) {
        resolved = true
        clearTimeout(t)
        reject(new Error(data.message))
      }
    }
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join_game', pin, role, playerId, name: playerName, avatar: playerAvatar }))
    }
    ws.onerror = () => {
      if (!resolved) { resolved = true; reject(new Error('connection error')) }
    }
  })
}

export function clientSend(conn, data) {
  if (conn.readyState === WebSocket.OPEN) {
    conn.send(JSON.stringify({ type: 'send', to: 'teacher', msg: data }))
  }
}

export function onClientData(conn, handler) {
  conn.onmessage = (e) => {
    let data
    try { data = JSON.parse(e.data) } catch { return }
    handler(data)
  }
}

export function destroyClient(client) {
  try { client.ws.close() } catch {}
}
