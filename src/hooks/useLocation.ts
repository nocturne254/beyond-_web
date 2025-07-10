'use client'

import { useState, useEffect } from 'react'
import { Location } from '@/types/astronomy'

interface UseLocationReturn {
  location: Location | null
  loading: boolean
  error: string | null
  requestLocation: () => void
}

export const useLocation = (): UseLocationReturn => {
  const [location, setLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: false, // Better for mobile
            timeout: 15000, // Longer timeout for mobile
            maximumAge: 600000 // 10 minutes
          }
        )
      })

      const { latitude, longitude } = position.coords
      
      // Try to get location name using reverse geocoding
      let locationData: Location = { latitude, longitude }
      
      try {
        // Use a free geocoding service to get location name
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        )
        
        if (response.ok) {
          const data = await response.json()
          locationData = {
            latitude,
            longitude,
            city: data.city || data.locality,
            country: data.countryName,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        }
      } catch (geocodeError) {
        console.warn('Failed to get location name:', geocodeError)
        // Continue with coordinates only
      }

      setLocation(locationData)
    } catch (err) {
      let errorMessage = 'Failed to get location'
      
      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location services.'
            break
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.'
            break
          case err.TIMEOUT:
            errorMessage = 'Location request timed out.'
            break
        }
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Force location request on mount with fallback
  useEffect(() => {
    if (!location && !loading && !error) {
      // Small delay to ensure page is loaded, then request location
      const timer = setTimeout(() => {
        // Requesting location permission
        requestLocation()
      }, 1000)

      // Fallback timer - if no location after 10 seconds, use default
      const fallbackTimer = setTimeout(() => {
        if (!location && !loading) {
          // Location timeout - using default location
          setLocation({
            latitude: -1.2921,
            longitude: 36.8219,
            city: 'Nairobi',
            country: 'Kenya',
            timezone: 'Africa/Nairobi'
          })
          setError('Using default location - click location button to set your location')
        }
      }, 10000)

      return () => {
        clearTimeout(timer)
        clearTimeout(fallbackTimer)
      }
    }
  }, []) // Only run once on mount

  return {
    location,
    loading,
    error,
    requestLocation
  }
}

// Hook for manual location setting (for exploring different locations)
export const useManualLocation = () => {
  const [manualLocation, setManualLocation] = useState<Location | null>(null)
  
  const setLocationByCoordinates = (latitude: number, longitude: number) => {
    setManualLocation({ latitude, longitude })
  }
  
  const setLocationByName = async (locationName: string) => {
    try {
      // Use a geocoding service to convert location name to coordinates
      const response = await fetch(
        `https://api.bigdatacloud.net/data/forward-geocode?query=${encodeURIComponent(locationName)}&key=free`
      )
      
      if (response.ok) {
        const data = await response.json()
        if (data.results && data.results.length > 0) {
          const result = data.results[0]
          setManualLocation({
            latitude: result.latitude,
            longitude: result.longitude,
            city: result.city,
            country: result.country
          })
        }
      }
    } catch (error) {
      console.error('Failed to geocode location:', error)
    }
  }
  
  const clearManualLocation = () => {
    setManualLocation(null)
  }
  
  return {
    manualLocation,
    setLocationByCoordinates,
    setLocationByName,
    clearManualLocation
  }
}
