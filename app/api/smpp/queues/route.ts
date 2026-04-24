import { NextResponse } from 'next/server'
import { authorizeRequest } from '@/lib/api-auth'
import { getQueueStats } from '@/smpp/queues/queue-manager'

export async function GET() {
  const auth = await authorizeRequest(['ADMIN', 'MANAGER'])
  if (!auth.ok) return auth.response

  const stats = await getQueueStats()
  return NextResponse.json(stats)
}
