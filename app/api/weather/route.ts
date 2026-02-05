import { NextRequest, NextResponse } from 'next/server'
import { getCurrentWeather } from '@/lib/weather'

// GET /api/weather?lat=xxx&lon=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')

    if (!lat || !lon) {
      return NextResponse.json(
        { error: 'Missing lat or lon parameter' },
        { status: 400 }
      )
    }

    const weather = await getCurrentWeather(Number(lat), Number(lon))

    if (!weather) {
      return NextResponse.json(
        { error: 'Failed to fetch weather data' },
        { status: 500 }
      )
    }

    return NextResponse.json(weather)
  } catch (error) {
    console.error('Weather API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
