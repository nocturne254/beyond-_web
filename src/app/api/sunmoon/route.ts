import { NextRequest } from 'next/server'

// Reliable solar/lunar times from MET Norway (requires User-Agent)
// Docs: https://api.met.no/weatherapi/sunrise/2.0/documentation

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon') || searchParams.get('lng')
  const date = searchParams.get('date') || new Date().toISOString().slice(0, 10)

  if (!lat || !lon) {
    return new Response(JSON.stringify({ error: 'lat and lon are required' }), { status: 400 })
  }

  try {
    const url = `https://api.met.no/weatherapi/sunrise/2.0/.json?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&date=${encodeURIComponent(date)}&offset=+00:00`
    const resp = await fetch(url, {
      headers: {
        // Provide a contact per met.no requirements
        'User-Agent': 'BeyondWeb/1.0 (contact: noreply@beyondweb.local)'
      },
      cache: 'no-store'
    })

    if (!resp.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch sun/moon data' }), { status: 502 })
    }

    const data = await resp.json()
    const loc = data?.location?.time?.[0]
    const result = {
      date,
      sunrise: loc?.sunrise?.time || null,
      sunset: loc?.sunset?.time || null,
      solarNoon: loc?.solarnoon?.time || null,
      moonrise: loc?.moonrise?.time || null,
      moonset: loc?.moonset?.time || null,
      moonPhase: loc?.moonphase?.value || null
    }
    return Response.json(result)
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Sun/Moon route failed' }), { status: 500 })
  }
}


