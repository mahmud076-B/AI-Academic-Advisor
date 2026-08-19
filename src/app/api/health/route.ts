import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { logServerEvent, generateRequestId } from '@/lib/server-logger'
import { recordTelemetryEvent, getTelemetrySummary } from '@/lib/telemetry'

export const dynamic = 'force-dynamic'

export async function GET() {
  const startTime = Date.now()
  const requestId = generateRequestId()
  let databaseStatus: 'connected' | 'unavailable' = 'unavailable'

  try {
    const supabase = await createClient()
    const { error } = await supabase.from('courses').select('id').limit(1)
    
    if (!error) {
      databaseStatus = 'connected'
    }
  } catch {
    databaseStatus = 'unavailable'
  }

  const isHealthy = databaseStatus === 'connected'
  const latencyMs = Date.now() - startTime

  recordTelemetryEvent({
    requestId,
    eventType: 'health_check',
    timestamp: new Date().toISOString(),
    status: isHealthy ? 'success' : 'warning',
    metrics: { totalLatencyMs: latencyMs },
  })

  return NextResponse.json(
    {
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: databaseStatus,
      latency_ms: latencyMs,
      telemetry: getTelemetrySummary(),
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'X-Request-Id': requestId,
      },
    }
  )
}
