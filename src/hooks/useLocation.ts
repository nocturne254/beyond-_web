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
		setLoading(true)
		setError(null)

		const geolocateWithBrowser = async () => {
			if (!navigator.geolocation) {
				throw new Error('Geolocation is not supported by this browser')
			}
			const position = await new Promise<GeolocationPosition>((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(
					resolve,
					reject,
					{
						enableHighAccuracy: false,
						timeout: 15000,
						maximumAge: 600000
					}
				)
			})
			return { latitude: position.coords.latitude, longitude: position.coords.longitude }
		}

		const geolocateWithIp = async () => {
			// IP-based fallback (approximate): ipapi.co JSON
			const resp = await fetch('https://ipapi.co/json/')
			if (!resp.ok) throw new Error('IP geolocation failed')
			const data = await resp.json()
			if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') throw new Error('Invalid IP location data')
			return { latitude: data.latitude, longitude: data.longitude, city: data.city, country: data.country_name, timezone: data.timezone }
		}

		try {
			let coords: { latitude: number; longitude: number; city?: string; country?: string; timezone?: string }
			try {
				coords = await geolocateWithBrowser()
			} catch (e) {
				coords = await geolocateWithIp()
			}

			// Reverse geocode city/country if browser provided only lat/lon
			let enriched: Location = { latitude: coords.latitude, longitude: coords.longitude, city: coords.city, country: coords.country, timezone: coords.timezone }
			if (!enriched.city || !enriched.country) {
				try {
					const response = await fetch(
						`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`
					)
					if (response.ok) {
						const data = await response.json()
						enriched = {
							latitude: coords.latitude,
							longitude: coords.longitude,
							city: data.city || data.locality,
							country: data.countryName,
							timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
						}
					}
				} catch {}
			setLocation(enriched)
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
			const timer = setTimeout(() => {
				requestLocation()
			}, 1000)
			const fallbackTimer = setTimeout(() => {
				if (!location && !loading) {
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
	}, [])

	return {
		location,
		loading,
		error,
		requestLocation
	}
}

// Manual location helpers unchanged
export const useManualLocation = () => {
	const [manualLocation, setManualLocation] = useState<Location | null>(null)
	const setLocationByCoordinates = (latitude: number, longitude: number) => {
		setManualLocation({ latitude, longitude })
	}
	const setLocationByName = async (locationName: string) => {
		try {
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
	const clearManualLocation = () => { setManualLocation(null) }
	return { manualLocation, setLocationByCoordinates, setLocationByName, clearManualLocation }
}
