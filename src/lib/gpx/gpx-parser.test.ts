import { describe, it, expect } from 'vitest'
import { parseGpx, GpxParseError } from './gpx-parser'

const validGpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test">
  <trk>
    <name>Morning Run</name>
    <trkseg>
      <trkpt lat="48.8566" lon="2.3522">
        <ele>35</ele>
        <time>2026-02-10T08:00:00Z</time>
      </trkpt>
      <trkpt lat="48.8606" lon="2.3376">
        <ele>45</ele>
        <time>2026-02-10T08:05:00Z</time>
      </trkpt>
      <trkpt lat="48.8650" lon="2.3210">
        <ele>30</ele>
        <time>2026-02-10T08:10:00Z</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`

const gpxNoElevation = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1">
  <trk>
    <trkseg>
      <trkpt lat="48.8566" lon="2.3522">
        <time>2026-02-10T08:00:00Z</time>
      </trkpt>
      <trkpt lat="48.8606" lon="2.3376">
        <time>2026-02-10T08:10:00Z</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`

const gpxSinglePoint = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1">
  <trk>
    <trkseg>
      <trkpt lat="48.8566" lon="2.3522">
        <ele>35</ele>
        <time>2026-02-10T08:00:00Z</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`

const gpxNoTimestamps = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1">
  <trk>
    <trkseg>
      <trkpt lat="48.8566" lon="2.3522">
        <ele>35</ele>
      </trkpt>
      <trkpt lat="48.8606" lon="2.3376">
        <ele>45</ele>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`

describe('parseGpx', () => {
  it('parses a valid GPX file and extracts correct metrics', () => {
    const metrics = parseGpx(validGpx)

    expect(metrics.duration).toBe(600) // 10 minutes = 600 seconds
    expect(metrics.distance).toBeGreaterThan(0)
    expect(metrics.avgSpeed).toBeGreaterThan(0)
    expect(metrics.maxSpeed).toBeGreaterThan(0)
    expect(metrics.elevationGain).toBe(10) // 35->45 = +10
    expect(metrics.elevationLoss).toBe(15) // 45->30 = -15
    expect(metrics.avgPace).toBeGreaterThan(0)
    expect(metrics.startDate).toBe('2026-02-10T08:00:00.000Z')
    expect(metrics.startLocation).toBe('Morning Run')
  })

  it('throws on empty string', () => {
    expect(() => parseGpx('')).toThrow(GpxParseError)
    expect(() => parseGpx('')).toThrow('Le fichier GPX est vide')
  })

  it('throws on invalid XML', () => {
    expect(() => parseGpx('<not-valid-xml')).toThrow(GpxParseError)
    expect(() => parseGpx('<not-valid-xml')).toThrow('Fichier XML invalide')
  })

  it('throws when no trackpoints found', () => {
    const noTrkpts = `<?xml version="1.0"?><gpx version="1.1"><trk><trkseg></trkseg></trk></gpx>`
    expect(() => parseGpx(noTrkpts)).toThrow(GpxParseError)
    expect(() => parseGpx(noTrkpts)).toThrow('Aucun point de trace trouvé')
  })

  it('handles GPX without elevation data', () => {
    const metrics = parseGpx(gpxNoElevation)

    expect(metrics.elevationGain).toBe(0)
    expect(metrics.elevationLoss).toBe(0)
    expect(metrics.distance).toBeGreaterThan(0)
    expect(metrics.duration).toBe(600) // 10 minutes
  })

  it('handles GPX with a single point', () => {
    const metrics = parseGpx(gpxSinglePoint)

    expect(metrics.distance).toBe(0)
    expect(metrics.duration).toBe(0)
    expect(metrics.avgSpeed).toBe(0)
    expect(metrics.maxSpeed).toBe(0)
    expect(metrics.elevationGain).toBe(0)
    expect(metrics.elevationLoss).toBe(0)
  })

  it('handles GPX without timestamps', () => {
    const metrics = parseGpx(gpxNoTimestamps)

    expect(metrics.duration).toBe(0)
    expect(metrics.avgSpeed).toBe(0)
    expect(metrics.maxSpeed).toBe(0)
    expect(metrics.distance).toBeGreaterThan(0) // distance still calculated from coords
    expect(metrics.elevationGain).toBe(10)
  })

  it('returns non-negative values for all metrics', () => {
    const metrics = parseGpx(validGpx)

    expect(metrics.duration).toBeGreaterThanOrEqual(0)
    expect(metrics.distance).toBeGreaterThanOrEqual(0)
    expect(metrics.avgSpeed).toBeGreaterThanOrEqual(0)
    expect(metrics.maxSpeed).toBeGreaterThanOrEqual(0)
    expect(metrics.elevationGain).toBeGreaterThanOrEqual(0)
    expect(metrics.elevationLoss).toBeGreaterThanOrEqual(0)
    expect(metrics.avgPace).toBeGreaterThanOrEqual(0)
  })

  it('returns undefined startLocation when track has no name', () => {
    const metrics = parseGpx(gpxNoElevation)
    expect(metrics.startLocation).toBeUndefined()
  })
})
