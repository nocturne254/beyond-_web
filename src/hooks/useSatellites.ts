'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Location, CelestialObject } from '@/types/astronomy'

// Lightweight SGP4 via satellite.js from CDN dynamic import when needed
type SatJs = typeof import('satellite.js')

const ISS_TLE = [
  '1 25544U 98067A   24150.54791667  .00016717  00000-0  10270-3 0  9998',
  '2 25544  51.6423  19.9131 0006446  50.2740 105.8278 15.50476862441103'
]
const HUBBLE_TLE = [
  '1 20580U 90037B   24149.86395833  .00000647  00000-0  32937-4 0  9993',
  '2 20580  28.4692  95.6309 0002790  77.2390 329.6378 15.09211955567805'
]

export interface UseSatellitesReturn {
  satellites: CelestialObject[]
}

export const useSatellites = (
  enabled: boolean,
  location: Location | null,
  currentTime: Date
): UseSatellitesReturn => {
  const [satjs, setSatjs] = useState<SatJs | null>(null)

  useEffect(() => {
    if (!enabled) return
    let mounted = true
    ;(async () => {
      try {
        const lib = await import('satellite.js')
        if (mounted) setSatjs(lib)
      } catch {}
    })()
    return () => { mounted = false }
  }, [enabled])

  const satellites = useMemo(() => {
    if (!enabled || !location || !satjs) return []
    const { twoline2satrec, propagate, gstime, eciToGeodetic, degreesLat, degreesLong } = satjs
    const t = new Date(currentTime)
    const gmst = gstime(t)

    const tleList = [
      { id: 'iss', name: 'ISS', tle: ISS_TLE, mag: 1.5 },
      { id: 'hubble', name: 'Hubble', tle: HUBBLE_TLE, mag: 2.0 },
    ]

    const out: CelestialObject[] = []
    for (const s of tleList) {
      try {
        const rec = twoline2satrec(s.tle[0], s.tle[1])
        const pv = propagate(rec, t)
        if (!pv.position) continue
        const geo = eciToGeodetic(pv.position, gmst)
        const satLat = degreesLat(geo.latitude)
        const satLon = degreesLong(geo.longitude)
        const dLon = ((satLon - location.longitude + 540) % 360) - 180
        const dLat = satLat - location.latitude
        const azimuth = (Math.atan2(dLon, dLat) * 180 / Math.PI + 360) % 360
        const altitude = 10 + 70 * Math.abs(Math.cos(((dLon + dLat) * Math.PI) / 180))
        const x = (azimuth / 360) * (typeof window !== 'undefined' ? window.innerWidth : 1920)
        const y = (typeof window !== 'undefined' ? window.innerHeight : 1080) - ((altitude + 30) / 120) * (typeof window !== 'undefined' ? window.innerHeight : 1080)
        out.push({ id: s.id, name: s.name, type: 'satellite', x, y, visible: altitude > 0, magnitude: s.mag, azimuth, altitude })
      } catch {}
    }
    return out
  }, [enabled, location, currentTime, satjs])

  return { satellites }
}


