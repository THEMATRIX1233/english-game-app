import { io } from 'socket.io-client'

let socket = null

export function connect() {
  if (!socket) {
    const url = import.meta.env.VITE_SOCKET_URL || undefined
    socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 15000,
    })
    socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message)
    })
  }
  return socket
}

export function getSocket() {
  return socket
}

export function disconnect() {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
}
