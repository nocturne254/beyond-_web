import { NextRequest } from 'next/server'

// Reliable public TLE source (no auth): Celestrak
// Example: /api/tle?group=active

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const group = searchParams.get('group') || 'visual'
  const url = `https://celestrak.org/NORAD/elements/gp.php?GROUP=${encodeURIComponent(group)}&FORMAT=tle`

  try {
    const resp = await fetch(url, { cache: 'no-store' })
    if (!resp.ok) return new Response(JSON.stringify({ error: 'Failed to fetch TLEs' }), { status: 502 })
    const text = await resp.text()
    // Return raw TLE text; client can parse as needed
    return new Response(text, { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'TLE route failed' }), { status: 500 })
  }
}


