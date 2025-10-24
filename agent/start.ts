import { agent } from './credential-monitor'

agent.start()

process.on('SIGINT', () => {
  agent.stop()
  process.exit(0)
})