import { NextRequest } from 'next/server'

// Return only galaxies from OpenNGC with optional magnitude/limit filters
const OPEN_NGC_JSON = 'https://raw.githubusercontent.com/mattiaverga/OpenNGC/master/opengd.json'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const maxMag = parseFloat(searchParams.get('maxMag') || '13')
  const limit = parseInt(searchParams.get('limit') || '1500', 10)

  try {
    const resp = await fetch(OPEN_NGC_JSON, { cache: 'no-store' })
    if (!resp.ok) return new Response(JSON.stringify({ error: 'Failed to fetch OpenNGC' }), { status: 502 })
    const json = await resp.json()

    const out: any[] = []
    for (const rec of json) {
      // Galaxy type in OpenNGC often 'G'
      if (rec.type !== 'G') continue
      const mag = rec.mag ?? 99
      if (mag > maxMag) continue
      out.push({
        id: String(rec.id),
        name: rec.name,
        catalog: rec.cat || rec.catalog,
        type: rec.type,
        ra: rec.ra,
        dec: rec.dec,
        mag: rec.mag,
        size: rec.size
      })
      if (out.length >= limit) break
    }

    return Response.json(out)
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Galaxies route failed' }), { status: 500 })
  }
}


