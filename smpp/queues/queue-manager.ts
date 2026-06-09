/**
 * Queue Manager — initialises BullMQ queues and workers over Redis (Upstash/ioredis).
 * All queues use a shared Redis connection.
 */

import { Queue, Worker, QueueEvents } from 'bullmq'
import IORedis from 'ioredis'
import net from 'net'
import type { SMPPOutboundJob, SMPPDLRJob } from './job-types'

let _connection: IORedis | null = null
let _redisErrorLogged = false

function getRedisUrl(): string | null {
  return process.env.REDIS_URL || null
}

export async function isRedisAvailable(timeoutMs = 500): Promise<boolean> {
  const url = getRedisUrl()
  if (!url) return false

  try {
    const parsed = new URL(url)
    const host = parsed.hostname || 'localhost'
    const port = Number(parsed.port || 6379)

    return await new Promise<boolean>((resolve) => {
      const socket = net.createConnection({ host, port })
      const done = (available: boolean) => {
        socket.removeAllListeners()
        socket.destroy()
        resolve(available)
      }

      socket.setTimeout(timeoutMs)
      socket.once('connect', () => done(true))
      socket.once('error', () => done(false))
      socket.once('timeout', () => done(false))
    })
  } catch {
    return false
  }
}

/** Returns the Redis connection, or null if no URL is configured (degraded mode). */
export function getRedisConnection(): IORedis | null {
  if (_connection) return _connection

  const url = getRedisUrl()
  if (!url) {
    console.warn('[queue-manager] No REDIS_URL configured — BullMQ workers disabled (degraded mode)')
    return null
  }

  _connection = new IORedis(url, {
    connectTimeout: 1000,
    enableOfflineQueue: false,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: () => null,
    tls: url.startsWith('rediss://') ? {} : undefined,
  })

  _connection.on('error', (err) => {
    if (!_redisErrorLogged) {
      console.error('[queue-manager] Redis unavailable - BullMQ is in degraded mode:', err.message)
      _redisErrorLogged = true
    }
  })

  return _connection
}

/** Returns true when a Redis connection is available */
export function hasRedis(): boolean {
  return !!getRedisUrl()
}

// -------------------------------------------------------
// Queue definitions
// -------------------------------------------------------
export const QUEUE_NAMES = {
  SMS_OUTBOUND: 'sms-outbound',
  SMS_DLR: 'sms-dlr',
  SMS_RETRY: 'sms-retry',
  BILLING: 'billing',
} as const

let _outboundQueue: Queue<SMPPOutboundJob> | null = null
let _dlrQueue: Queue<SMPPDLRJob> | null = null

export function getOutboundQueue(): Queue<SMPPOutboundJob> | null {
  const conn = getRedisConnection()
  if (!conn) return null
  if (!_outboundQueue) {
    _outboundQueue = new Queue<SMPPOutboundJob>(QUEUE_NAMES.SMS_OUTBOUND, {
      connection: conn,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    })
  }
  return _outboundQueue
}

export function getDLRQueue(): Queue<SMPPDLRJob> | null {
  const conn = getRedisConnection()
  if (!conn) return null
  if (!_dlrQueue) {
    _dlrQueue = new Queue<SMPPDLRJob>(QUEUE_NAMES.SMS_DLR, {
      connection: conn,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    })
  }
  return _dlrQueue
}

// -------------------------------------------------------
// Queue stats helper (for UI)
// -------------------------------------------------------
export async function getQueueStats() {
  try {
    const outbound = getOutboundQueue()
    const dlr = getDLRQueue()
    if (!outbound || !dlr) {
      return {
        outbound: { waiting: 0, active: 0, failed: 0, completed: 0 },
        dlr: { waiting: 0, active: 0, failed: 0, completed: 0 },
      }
    }

    const [
      outboundWaiting,
      outboundActive,
      outboundFailed,
      outboundCompleted,
      dlrWaiting,
      dlrActive,
      dlrFailed,
      dlrCompleted,
    ] = await Promise.all([
      outbound.getWaitingCount(),
      outbound.getActiveCount(),
      outbound.getFailedCount(),
      outbound.getCompletedCount(),
      dlr.getWaitingCount(),
      dlr.getActiveCount(),
      dlr.getFailedCount(),
      dlr.getCompletedCount(),
    ])

    return {
      outbound: { waiting: outboundWaiting, active: outboundActive, failed: outboundFailed, completed: outboundCompleted },
      dlr: { waiting: dlrWaiting, active: dlrActive, failed: dlrFailed, completed: dlrCompleted },
    }
  } catch {
    return {
      outbound: { waiting: 0, active: 0, failed: 0, completed: 0 },
      dlr: { waiting: 0, active: 0, failed: 0, completed: 0 },
    }
  }
}
