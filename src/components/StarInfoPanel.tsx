'use client'

import React, { useState, useEffect } from 'react'
import { X, ExternalLink, Star as StarIcon, Thermometer, Ruler, Eye } from 'lucide-react'
import { Star } from '@/types/astronomy'

interface StarInfoPanelProps {
  star: Star | null
  onClose: () => void
  nightMode?: boolean
}

interface WikipediaInfo {
  title: string
  extract: string
  url: string
  thumbnail?: string
}

const StarInfoPanel: React.FC<StarInfoPanelProps> = ({ star, onClose, nightMode = true }) => {
  const [wikipediaInfo, setWikipediaInfo] = useState<WikipediaInfo | null>(null)
  const [loadingWiki, setLoadingWiki] = useState(false)

  // Fetch Wikipedia information when star changes
  useEffect(() => {
    if (!star) return

    const fetchWikipediaInfo = async () => {
      setLoadingWiki(true)
      try {
        // Try to fetch Wikipedia info for the star
        const searchTerm = star.commonName || star.name
        const response = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`
        )
        
        if (response.ok) {
          const data = await response.json()
          setWikipediaInfo({
            title: data.title,
            extract: data.extract,
            url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(searchTerm)}`,
            thumbnail: data.thumbnail?.source
          })
        } else {
          // Fallback: try searching for the star
          const searchResponse = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(star.name + ' star')}`
          )
          if (searchResponse.ok) {
            const searchData = await searchResponse.json()
            setWikipediaInfo({
              title: searchData.title,
              extract: searchData.extract,
              url: searchData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(star.name)}`,
              thumbnail: searchData.thumbnail?.source
            })
          }
        }
      } catch (error) {
        console.error('Failed to fetch Wikipedia info:', error)
      } finally {
        setLoadingWiki(false)
      }
    }

    fetchWikipediaInfo()
  }, [star])

  if (!star) return null

  const getSpectralClassDescription = (spectralClass: string) => {
    const mainClass = spectralClass.charAt(0).toUpperCase()
    const descriptions: { [key: string]: string } = {
      'O': 'Very hot blue star',
      'B': 'Hot blue-white star',
      'A': 'White star',
      'F': 'Yellow-white star',
      'G': 'Yellow star (like our Sun)',
      'K': 'Orange star',
      'M': 'Cool red star'
    }
    return descriptions[mainClass] || 'Unknown type'
  }

  const getMagnitudeDescription = (magnitude: number) => {
    if (magnitude < 0) return 'Extremely bright'
    if (magnitude < 1) return 'Very bright'
    if (magnitude < 2) return 'Bright'
    if (magnitude < 3) return 'Moderately bright'
    if (magnitude < 4) return 'Visible to naked eye'
    if (magnitude < 5) return 'Faint'
    return 'Very faint'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className={`star-info-panel ${nightMode ? 'bg-space-dark text-white' : 'bg-white text-gray-800 border border-gray-300'} rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold flex items-center">
              <StarIcon className="w-6 h-6 mr-2" style={{ color: star.color }} />
              {star.commonName || star.name}
            </h2>
            {star.commonName && star.name !== star.commonName && (
              <p className="text-gray-400 mt-1">{star.name}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <StarIcon className="w-4 h-4" />
                <span className="font-medium">Constellation:</span>
                <span>{star.constellation}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span className="font-medium">Magnitude:</span>
                <span>{star.magnitude.toFixed(2)} ({getMagnitudeDescription(star.magnitude)})</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Thermometer className="w-4 h-4" />
                <span className="font-medium">Spectral Class:</span>
                <span>{star.spectralClass} ({getSpectralClassDescription(star.spectralClass)})</span>
              </div>
              
              {star.distance && (
                <div className="flex items-center space-x-2">
                  <Ruler className="w-4 h-4" />
                  <span className="font-medium">Distance:</span>
                  <span>{star.distance.toFixed(1)} light years</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <span className="font-medium">Coordinates:</span>
                <div className="text-sm text-gray-300 mt-1">
                  <div>RA: {star.rightAscension.toFixed(4)}h</div>
                  <div>Dec: {star.declination.toFixed(4)}°</div>
                </div>
              </div>
              
              <div>
                <span className="font-medium">Current Position:</span>
                <div className="text-sm text-gray-300 mt-1">
                  <div>Azimuth: {star.azimuth.toFixed(1)}°</div>
                  <div>Altitude: {star.altitude.toFixed(1)}°</div>
                </div>
              </div>
              
              {star.temperature && (
                <div>
                  <span className="font-medium">Temperature:</span>
                  <div className="text-sm text-gray-300 mt-1">
                    {star.temperature.toLocaleString()} K
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Star Color Preview */}
          <div className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg">
            <div 
              className="w-8 h-8 rounded-full"
              style={{ backgroundColor: star.color, boxShadow: `0 0 20px ${star.color}` }}
            ></div>
            <div>
              <div className="font-medium">Star Color</div>
              <div className="text-sm text-gray-300">
                Based on spectral class {star.spectralClass}
              </div>
            </div>
          </div>

          {/* Wikipedia Information */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-semibold mb-3">About This Star</h3>
            
            {loadingWiki ? (
              <div className="flex items-center space-x-2 text-gray-400">
                <div className="loading-spinner"></div>
                <span>Loading information...</span>
              </div>
            ) : wikipediaInfo ? (
              <div className="space-y-3">
                {wikipediaInfo.thumbnail && (
                  <img 
                    src={wikipediaInfo.thumbnail} 
                    alt={wikipediaInfo.title}
                    className="w-32 h-32 object-cover rounded-lg float-right ml-4 mb-2"
                  />
                )}
                
                <p className="text-gray-300 leading-relaxed">
                  {wikipediaInfo.extract}
                </p>
                
                <a
                  href={wikipediaInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Read more on Wikipedia</span>
                </a>
              </div>
            ) : (
              <div className="text-gray-400">
                <p>No additional information available for this star.</p>
                <p className="text-sm mt-2">
                  You can search for "{star.commonName || star.name}" on Wikipedia or other astronomy resources.
                </p>
              </div>
            )}
          </div>

          {/* Fun Facts */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-semibold mb-3">Did You Know?</h3>
            <div className="space-y-2 text-sm text-gray-300">
              {star.distance && (
                <div>
                  • Light from this star takes {star.distance.toFixed(1)} years to reach Earth
                </div>
              )}
              {star.magnitude < 0 && (
                <div>
                  • This is one of the brightest stars visible from Earth
                </div>
              )}
              {star.spectralClass.startsWith('G') && (
                <div>
                  • This star is similar to our Sun in temperature and color
                </div>
              )}
              {star.spectralClass.startsWith('M') && (
                <div>
                  • This is a red dwarf star, the most common type in our galaxy
                </div>
              )}
              {star.spectralClass.startsWith('O') || star.spectralClass.startsWith('B') && (
                <div>
                  • This is a massive, hot star that burns through its fuel quickly
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StarInfoPanel
