export interface GpxMetrics {
  duration: number
  distance: number
  avgSpeed: number
  maxSpeed: number
  elevationGain: number
  elevationLoss: number
  avgPace: number
  startDate: string
  startLocation?: string
}

export class GpxParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GpxParseError'
  }
}

interface TrackPoint {
  lat: number
  lon: number
  ele?: number
  time?: Date
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function parseGpx(xmlString: string): GpxMetrics {
  if (!xmlString || xmlString.trim().length === 0) {
    throw new GpxParseError('Le fichier GPX est vide')
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'application/xml')

  const parseError = doc.querySelector('parsererror')
  if (parseError) {
    throw new GpxParseError('Fichier XML invalide')
  }

  const trkpts = doc.querySelectorAll('trkpt')
  if (trkpts.length === 0) {
    throw new GpxParseError('Aucun point de trace trouvé dans le fichier GPX')
  }

  const trackName = doc.querySelector('trk > name')?.textContent || undefined

  const points: TrackPoint[] = []
  trkpts.forEach((pt) => {
    const lat = parseFloat(pt.getAttribute('lat') || '0')
    const lon = parseFloat(pt.getAttribute('lon') || '0')
    const eleEl = pt.querySelector('ele')
    const timeEl = pt.querySelector('time')
    points.push({
      lat,
      lon,
      ele: eleEl ? parseFloat(eleEl.textContent || '0') : undefined,
      time: timeEl && timeEl.textContent ? new Date(timeEl.textContent) : undefined,
    })
  })

  let totalDistance = 0
  let elevationGain = 0
  let elevationLoss = 0
  let maxSpeed = 0

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]

    const dist = haversineDistance(prev.lat, prev.lon, curr.lat, curr.lon)
    totalDistance += dist

    if (prev.ele !== undefined && curr.ele !== undefined) {
      const elevDiff = curr.ele - prev.ele
      if (elevDiff > 0) elevationGain += elevDiff
      else elevationLoss += Math.abs(elevDiff)
    }

    if (prev.time && curr.time) {
      const timeDiff = (curr.time.getTime() - prev.time.getTime()) / 1000
      if (timeDiff > 0) {
        const speedKmh = (dist / 1000) / (timeDiff / 3600)
        if (speedKmh > maxSpeed) maxSpeed = speedKmh
      }
    }
  }

  const firstTime = points[0].time
  const lastTime = points[points.length - 1].time
  const duration =
    firstTime && lastTime
      ? Math.floor((lastTime.getTime() - firstTime.getTime()) / 1000)
      : 0

  const avgSpeed =
    duration > 0 ? (totalDistance / 1000) / (duration / 3600) : 0

  const avgPace =
    totalDistance > 0 ? duration / (totalDistance / 1000) : 0

  const startDate = firstTime
    ? firstTime.toISOString()
    : new Date().toISOString()

  return {
    duration: Math.max(0, Math.round(duration)),
    distance: Math.max(0, Math.round(totalDistance)),
    avgSpeed: Math.round(avgSpeed * 100) / 100,
    maxSpeed: Math.round(maxSpeed * 100) / 100,
    elevationGain: Math.round(elevationGain),
    elevationLoss: Math.round(elevationLoss),
    avgPace: Math.round(avgPace),
    startDate,
    startLocation: trackName,
  }
}
