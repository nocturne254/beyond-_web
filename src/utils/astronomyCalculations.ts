import { Location, Star, SkyContext, StarCatalogEntry } from '@/types/astronomy'

/**
 * Core astronomy calculations for star positioning
 * Based on the original Beyond app's astronomy engine
 */

// Convert degrees to radians
export const degToRad = (degrees: number): number => degrees * (Math.PI / 180)

// Convert radians to degrees
export const radToDeg = (radians: number): number => radians * (180 / Math.PI)

// Convert hours to degrees (for right ascension)
export const hoursToDeg = (hours: number): number => hours * 15

/**
 * Calculate Local Sidereal Time
 * Essential for converting celestial coordinates to local coordinates
 */
export const calculateLocalSiderealTime = (location: Location, dateTime: Date): number => {
  const jd = dateToJulianDay(dateTime)
  const t = (jd - 2451545.0) / 36525.0
  
  // Greenwich Mean Sidereal Time
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t - (t * t * t) / 38710000.0
  
  // Normalize to 0-360 degrees
  gmst = gmst % 360
  if (gmst < 0) gmst += 360
  
  // Convert to Local Sidereal Time
  const lst = gmst + location.longitude
  return lst % 360
}

/**
 * Convert date to Julian Day
 */
export const dateToJulianDay = (date: Date): number => {
  const a = Math.floor((14 - (date.getMonth() + 1)) / 12)
  const y = date.getFullYear() + 4800 - a
  const m = (date.getMonth() + 1) + 12 * a - 3
  
  return date.getDate() + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045 + 
         (date.getHours() - 12) / 24 + date.getMinutes() / 1440 + date.getSeconds() / 86400
}

/**
 * Convert equatorial coordinates (RA, Dec) to horizontal coordinates (Az, Alt)
 */
export const equatorialToHorizontal = (
  ra: number, // right ascension in degrees
  dec: number, // declination in degrees
  lst: number, // local sidereal time in degrees
  latitude: number // observer latitude in degrees
): { azimuth: number; altitude: number } => {
  const raRad = degToRad(ra)
  const decRad = degToRad(dec)
  const lstRad = degToRad(lst)
  const latRad = degToRad(latitude)
  
  // Hour angle
  const ha = lstRad - raRad
  
  // Calculate altitude
  const sinAlt = Math.sin(decRad) * Math.sin(latRad) + Math.cos(decRad) * Math.cos(latRad) * Math.cos(ha)
  const altitude = Math.asin(sinAlt)
  
  // Calculate azimuth
  const cosAz = (Math.sin(decRad) - Math.sin(altitude) * Math.sin(latRad)) / (Math.cos(altitude) * Math.cos(latRad))
  let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz)))
  
  // Adjust azimuth quadrant
  if (Math.sin(ha) > 0) {
    azimuth = 2 * Math.PI - azimuth
  }
  
  return {
    azimuth: radToDeg(azimuth),
    altitude: radToDeg(altitude)
  }
}

/**
 * Convert horizontal coordinates to screen coordinates
 * Improved version that shows more stars on screen
 */
export const horizontalToScreen = (
  azimuth: number,
  altitude: number,
  screenWidth: number,
  screenHeight: number
): { x: number; y: number; visible: boolean } => {
  // Calculate position for ALL stars, even those below horizon
  // We'll determine visibility later based on the calculated position

  // Improved projection that distributes stars better across the entire screen
  // Map azimuth (0-360°) to full screen width
  const normalizedAz = ((azimuth % 360) + 360) % 360 // Ensure 0-360
  const screenX = (normalizedAz / 360) * screenWidth

  // Map altitude (-30° to 90°) to screen height - extended range
  // Higher altitudes appear higher on screen
  const minAlt = -30
  const maxAlt = 90
  const normalizedAlt = Math.max(minAlt, Math.min(maxAlt, altitude))
  const altitudeRange = maxAlt - minAlt // 120 degrees total
  const screenY = screenHeight - ((normalizedAlt - minAlt) / altitudeRange) * screenHeight

  // Determine visibility based on altitude and screen position
  const margin = 100
  const withinScreen = screenX >= -margin && screenX <= screenWidth + margin &&
                      screenY >= -margin && screenY <= screenHeight + margin

  // Show stars that are above horizon OR within reasonable range below horizon
  const visible = altitude > -25 && withinScreen

  // Debug logging removed for production

  return {
    x: screenX,
    y: screenY,
    visible
  }
}

/**
 * Calculate star color based on spectral class
 */
export const getStarColor = (spectralClass: string): string => {
  const firstChar = spectralClass.charAt(0).toUpperCase()
  
  switch (firstChar) {
    case 'O': return '#9bb0ff' // Blue
    case 'B': return '#aabfff' // Blue-white
    case 'A': return '#cad7ff' // White
    case 'F': return '#f8f7ff' // Yellow-white
    case 'G': return '#fff4ea' // Yellow (like our Sun)
    case 'K': return '#ffcc6f' // Orange
    case 'M': return '#ffaa77' // Red
    default: return '#ffffff' // Default white
  }
}

/**
 * Calculate star size based on magnitude
 */
export const getStarSize = (magnitude: number): number => {
  // Brighter stars (lower magnitude) are larger
  // Magnitude scale: -1.5 (brightest) to 6.5 (faintest visible)
  const size = Math.max(1, 8 - magnitude * 1.2)
  return Math.min(size, 12) // Cap maximum size
}

/**
 * Process star catalog data into renderable stars
 */
export const processStarData = (
  starCatalog: StarCatalogEntry[],
  context: SkyContext,
  screenWidth: number,
  screenHeight: number,
  minimumMagnitude: number = 6.0
): Star[] => {
  const { location, dateTime } = context
  const lst = calculateLocalSiderealTime(location, dateTime)

  const processedStars = starCatalog
    .filter(star => star.mag <= minimumMagnitude)
    .map(catalogStar => {
      const ra = hoursToDeg(catalogStar.ra)
      const { azimuth, altitude } = equatorialToHorizontal(ra, catalogStar.dec, lst, location.latitude)
      const { x, y, visible } = horizontalToScreen(azimuth, altitude, screenWidth, screenHeight)

      return {
        id: catalogStar.id,
        name: catalogStar.name,
        commonName: catalogStar.commonName,
        constellation: catalogStar.constellation,
        rightAscension: catalogStar.ra,
        declination: catalogStar.dec,
        magnitude: catalogStar.mag,
        spectralClass: catalogStar.spectralClass,
        temperature: catalogStar.temp,
        distance: catalogStar.distance,
        color: getStarColor(catalogStar.spectralClass),
        x,
        y,
        visible,
        azimuth,
        altitude
      }
    })

  const visibleStars = processedStars.filter(star => star.visible)

  return visibleStars
}
