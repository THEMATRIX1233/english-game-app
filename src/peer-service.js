import Peer from 'peerjs'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
  ],
  sdpSemantics: 'unified-plan'
}

const PEER_OPTIONS = { debug: 0, config: ICE_SERVERS }

export function generatePin() {
  return Math.random().toString(36).substring(2, 6).toUpperCase()
}

// ===== HOST (Teacher's browser) =====

export function createHost(pin) {
  const peer = new Peer(pin, PEER_OPTIONS)
  const host = { peer, pin, connections: new Map(), displayConn: null }
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), 30000)
    peer.on('open', () => { clearTimeout(t); resolve(host) })
    peer.on('error', (e) => { clearTimeout(t); reject(e) })
  })
}

export function onHostConnection(host, cb) {
  host.peer.on('connection', (conn) => {
    let resolved = false
    const info = { conn, playerId: null, name: '', avatar: '' }
    conn.on('data', (data) => {
      if (!resolved && data.type === 'join') {
        resolved = true
        info.playerId = data.playerId
        info.name = data.name
        info.avatar = data.avatar
        info.role = data.role || 'player'
        if (info.role === 'display') {
          host.displayConn = conn
        } else {
          host.connections.set(conn, info)
        }
      }
      cb(conn, info, data)
    })
    conn.on('close', () => {
      host.connections.delete(conn)
      if (host.displayConn === conn) host.displayConn = null
    })
  })
}

export function hostSend(conn, data) {
  try { conn.send(data) } catch {}
}

export function hostBroadcast(host, data) {
  host.connections.forEach((_, conn) => hostSend(conn, data))
  if (host.displayConn) hostSend(host.displayConn, data)
}

export function hostBroadcastAll(host, data) {
  hostBroadcast(host, data)
  hostSend(host.peer, data)
}

export function destroyHost(host) {
  host.connections.forEach((_, conn) => { try { conn.close() } catch {} })
  host.peer.destroy()
}

// ===== CLIENT (Student / Display browser) =====

export function connectToHost(pin, role = 'player') {
  const peer = new Peer(undefined, PEER_OPTIONS)
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), 30000)
    peer.on('open', (id) => {
      const conn = peer.connect(pin, { reliable: true })
      const client = { peer, conn, id }
      conn.on('open', () => {
        clearTimeout(t)
        resolve(client)
      })
      conn.on('error', (e) => { clearTimeout(t); reject(e) })
    })
    peer.on('error', (e) => { clearTimeout(t); reject(e) })
  })
}

export function clientSend(conn, data) {
  try { conn.send(data) } catch {}
}

export function onClientData(conn, handler) {
  conn.on('data', handler)
}

export function destroyClient(client) {
  if (client.conn && client.conn.open) client.conn.close()
  client.peer.destroy()
}
