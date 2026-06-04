import { spawn } from 'child_process'

const server = spawn('node', ['server.js'], {
  cwd: process.cwd(),
  stdio: ['pipe', 'pipe', 'pipe'],
})

server.stdout.on('data', (d) => process.stdout.write(d))
server.stderr.on('data', (d) => process.stderr.write(d))

// Wait for server to start, then launch tunnel
setTimeout(() => {
  const tunnel = spawn('npx', ['--yes', 'localtunnel', '--port', '3001'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true,
  })

  tunnel.stdout.on('data', (d) => {
    const msg = d.toString()
    process.stdout.write(msg)
    // Extract URL from localtunnel output
    const match = msg.match(/https:\/\/[a-z-]+\.loca\.lt/)
    if (match) {
      console.log('\n============================================')
      console.log('  ✅ TUNEL ACTIVO! Comparte esta URL:')
      console.log('  🌐 ' + match[0])
      console.log('')
      console.log('  PROFESOR:  ' + match[0] + '/#lobby')
      console.log('  JUGADORES: ' + match[0] + '/#play')
      console.log('  PANTALLA:  ' + match[0] + '/#game')
      console.log('============================================\n')
    }
  })
  tunnel.stderr.on('data', (d) => process.stderr.write(d))

  process.on('SIGINT', () => { server.kill(); tunnel.kill(); process.exit() })
}, 3000)

process.on('SIGINT', () => { server.kill(); process.exit() })
