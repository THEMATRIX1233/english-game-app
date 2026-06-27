import mqtt from 'mqtt'

const BROKERS = [
  'wss://broker.hivemq.com:8884/mqtt',
  'wss://wss.emqx.io:8084/mqtt',
]

let _host = null

function log(...args) {
  console.log('[peer]', ...args)
}

function connectMQTT() {
  const url = BROKERS[_brokerIndex % BROKERS.length]
  log('connecting to', url)
  return mqtt.connect(url, {
    clientId: 'e_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    clean: true,
    connectTimeout: 8000,
  })
}

let _brokerIndex = 0
let _lastClient = null

function getClient() {
  if (_lastClient) return _lastClient
  _lastClient = connectMQTT()
  return _lastClient
}

function reconnectClient() {
  if (_lastClient) {
    try { _lastClient.end(true) } catch {}
  }
  _brokerIndex++
  _lastClient = connectMQTT()
  return _lastClient
}

export function generatePin() {
  return Math.random().toString(36).substring(2, 6).toUpperCase()
}

// ===== HOST (Teacher) =====

export function createHost(pin) {
  log('createHost', pin)
  const client = getClient()
  const host = { client, pin, players: new Map(), displayConnected: false }
  let connected = false

  client.on('error', (e) => log('host error', e && e.message))
  client.on('close', () => { if (connected) log('host close') })

  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      if (!connected) {
        log('host timeout, trying next broker')
        const c2 = reconnectClient()
        c2.on('connect', () => {
          log('host connected on retry')
          connected = true
          clearTimeout(t)
          c2.subscribe('game/' + pin + '/join', { qos: 0 })
          c2.subscribe('game/' + pin + '/answer', { qos: 0 })
          _host = host
          host.client = c2
          resolve(host)
        })
        c2.on('error', (e2) => log('host retry error', e2 && e2.message))
      }
    }, 5000)

    client.on('connect', () => {
      if (connected) return
      connected = true
      clearTimeout(t)
      log('host connected', pin)
      client.subscribe('game/' + pin + '/join', { qos: 0 })
      client.subscribe('game/' + pin + '/answer', { qos: 0 })
      _host = host
      resolve(host)
    })
  })
}

export function onHostConnection(host, cb) {
  const handler = (topic, message) => {
    let data
    try { data = JSON.parse(message.toString()) } catch { return }
    log('host recv', topic.slice(-10), data.type)
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
    const topic = 'game/' + _host.pin + '/to_' + conn.playerId
    log('hostSend', topic.slice(-20), data.type)
    _host.client.publish(topic, JSON.stringify(data), { qos: 0 })
  }
}

export function hostBroadcast(host, data) {
  host.client.publish('game/' + host.pin + '/state', JSON.stringify(data), { qos: 0 })
}

export function hostBroadcastAll(host, data) {
  hostBroadcast(host, data)
}

export function destroyHost(host) {
  try { host.client.end(true) } catch {}
  _host = null
}

// ===== CLIENT =====

export function connectToHost(pin, role, playerName, playerAvatar) {
  const playerId = 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  log('connectToHost', pin, role, playerId)
  const client = getClient()
  const conn = { client, playerId, pin, _role: role }
  const clientObj = { peer: client, conn, id: playerId }
  const isPlayer = role === 'player'

  client.on('error', (e) => log('client error', e && e.message))

  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      log('client timeout', playerId, 'trying next broker')
      const c2 = reconnectClient()
      const conn2 = { client: c2, playerId, pin, _role: role }
      clientObj.peer = c2
      clientObj.conn = conn2
      let subs = 0
      let resolved = false
      c2.on('connect', () => {
        c2.subscribe('game/' + pin + '/state', { qos: 0 }, () => {
          subs++; if (subs >= 2) tryJoin()
        })
        c2.subscribe('game/' + pin + '/to_' + playerId, { qos: 0 }, () => {
          subs++; if (subs >= 2) tryJoin()
        })
      })
      function tryJoin() {
        if (resolved) return
        if (isPlayer) {
          c2.publish('game/' + pin + '/join', JSON.stringify({
            type: 'join', playerId, name: playerName || '', avatar: playerAvatar || '', role: 'player',
          }), { qos: 0 })
        } else {
          resolved = true; clearTimeout(t); resolve(clientObj)
        }
      }
      c2.on('message', (topic, message) => {
        if (!isPlayer || resolved) return
        let data
        try { data = JSON.parse(message.toString()) } catch { return }
        if (topic === 'game/' + pin + '/to_' + playerId) {
          resolved = true; clearTimeout(t); resolve(clientObj)
        }
      })
      c2.on('error', (e2) => log('client retry error', e2 && e2.message))
    }, 5000)

    let subs = 0
    let resolved = false
    client.on('connect', () => {
      client.subscribe('game/' + pin + '/state', { qos: 0 }, () => {
        subs++; if (subs >= 2 && !resolved) tryJoin()
      })
      client.subscribe('game/' + pin + '/to_' + playerId, { qos: 0 }, () => {
        subs++; if (subs >= 2 && !resolved) tryJoin()
      })
    })
    function tryJoin() {
      if (resolved) return
      if (isPlayer) {
        log('sending join', playerId)
        client.publish('game/' + pin + '/join', JSON.stringify({
          type: 'join', playerId, name: playerName || '', avatar: playerAvatar || '', role: 'player',
        }), { qos: 0 })
      } else {
        resolved = true; clearTimeout(t); resolve(clientObj)
      }
    }
    client.on('message', (topic, message) => {
      if (!isPlayer || resolved) return
      let data
      try { data = JSON.parse(message.toString()) } catch { return }
      log('client msg', topic.slice(-15), data.type)
      if (topic === 'game/' + pin + '/to_' + playerId) {
        log('joined received')
        resolved = true; clearTimeout(t); resolve(clientObj)
      }
    })
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
