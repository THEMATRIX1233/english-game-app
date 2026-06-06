import mqtt from 'mqtt'

const BROKER_URL = 'wss://broker.hivemq.com:8884/mqtt'
let _host = null

export function generatePin() {
  return Math.random().toString(36).substring(2, 6).toUpperCase()
}

// ===== HOST (Teacher's browser) =====

export function createHost(pin) {
  const client = mqtt.connect(BROKER_URL, {
    clientId: 'h_' + pin + '_' + Date.now(),
    clean: true,
  })
  const host = { client, pin, players: new Map(), displayConnected: false }
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('No se pudo crear el juego.')), 15000)
    client.on('connect', () => {
      clearTimeout(t)
      client.subscribe('game/' + pin + '/join', { qos: 0 })
      client.subscribe('game/' + pin + '/answer', { qos: 0 })
      _host = host
      resolve(host)
    })
    client.on('error', (e) => { clearTimeout(t); reject(e) })
  })
}

export function onHostConnection(host, cb) {
  const handler = (topic, message) => {
    let data
    try { data = JSON.parse(message.toString()) } catch { return }
    if (topic.endsWith('/join')) {
      const playerId = data.playerId || data.id
      const info = { playerId, name: data.name || '', avatar: data.avatar || '' }
      info.role = data.role || 'player'
      if (!host.players.has(playerId)) host.players.set(playerId, info)
      if (info.role === 'display') host.displayConnected = true
      cb({ playerId }, info, { type: 'join', playerId, name: data.name, avatar: data.avatar, role: data.role })
    } else if (topic.endsWith('/answer')) {
      cb({ playerId: data.playerId }, { playerId: data.playerId }, data)
    }
  }
  host.client.on('message', handler)
}

export function hostSend(conn, data) {
  if (_host && conn && conn.playerId) {
    _host.client.publish('game/' + _host.pin + '/to_' + conn.playerId, JSON.stringify(data), { qos: 0 })
  }
}

export function hostBroadcast(host, data) {
  host.client.publish('game/' + host.pin + '/state', JSON.stringify(data), { qos: 0 })
}

export function hostBroadcastAll(host, data) {
  host.client.publish('game/' + host.pin + '/state', JSON.stringify(data), { qos: 0 })
}

export function destroyHost(host) {
  try { host.client.end(true) } catch {}
  _host = null
}

// ===== CLIENT (Student / Display browser) =====

export function connectToHost(pin, role, playerName, playerAvatar) {
  const playerId = 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  const client = mqtt.connect(BROKER_URL, {
    clientId: 'c_' + playerId + '_' + Date.now(),
    clean: true,
  })
  const conn = { client, playerId, pin, _role: role }
  const clientObj = { peer: client, conn, id: playerId }
  const isPlayer = role === 'player'
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('No se pudo conectar. Verifica el PIN.')), 15000)
    let resolved = false
    client.on('connect', () => {
      client.subscribe('game/' + pin + '/state', { qos: 0 })
      client.subscribe('game/' + pin + '/to_' + playerId, { qos: 0 })
      if (isPlayer) {
        client.publish('game/' + pin + '/join', JSON.stringify({
          type: 'join', playerId,
          name: playerName || '', avatar: playerAvatar || '', role: 'player',
        }), { qos: 0 })
      } else {
        resolved = true; clearTimeout(t); resolve(clientObj)
      }
    })
    client.on('message', (topic, message) => {
      if (!isPlayer || resolved) return
      let data
      try { data = JSON.parse(message.toString()) } catch { return }
      if (topic === 'game/' + pin + '/to_' + playerId) {
        resolved = true; clearTimeout(t); resolve(clientObj)
      }
    })
    client.on('error', () => { if (!resolved) { clearTimeout(t); reject(new Error('Error de conexión.')) } })
  })
}

export function clientSend(conn, data) {
  if (conn && conn.client && conn.client.connected) {
    const topic = data.type === 'join'
      ? 'game/' + conn.pin + '/join'
      : 'game/' + conn.pin + '/answer'
    conn.client.publish(topic, JSON.stringify(data), { qos: 0 })
  }
}

export function onClientData(conn, handler) {
  const topicState = 'game/' + conn.pin + '/state'
  const topicTo = 'game/' + conn.pin + '/to_' + conn.playerId
  conn.client.on('message', (topic, message) => {
    let data
    try { data = JSON.parse(message.toString()) } catch { return }
    if (topic === topicState || topic === topicTo) handler(data)
  })
}

export function destroyClient(client) {
  try { client.peer.end(true) } catch {}
}
