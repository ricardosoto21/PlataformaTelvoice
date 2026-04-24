/**
 * Limpia todos los jobs fallidos y en espera de la cola sms-outbound en Redis.
 * Útil para eliminar jobs viejos con código roto que siguen reintentando.
 */
import IORedis from 'ioredis'
import { Queue } from 'bullmq'

const REDIS_URL = 'redis://localhost:6379'

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})

const queue = new Queue('sms-outbound', { connection })

console.log('Cleaning sms-outbound queue...')
await queue.obliterate({ force: true })
console.log('✅ Queue cleared. All stale/failed jobs removed.')

await connection.quit()
