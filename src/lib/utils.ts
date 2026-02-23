import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns the current date (or given date) as a YYYY-MM-DD string
 * using local timezone components to avoid UTC midnight offset issues.
 */
export function toLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Returns the current date+time as a "YYYY-MM-DDTHH:mm" string
 * using local timezone components — format attendu par input[datetime-local].
 */
export function formatLocalDatetime(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d}T${h}:${min}`
}

/**
 * Convert a camelCase string to snake_case.
 */
export function toSnakeCaseKey(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

/**
 * Convert a snake_case string to camelCase.
 */
export function toCamelCaseKey(key: string): string {
  return key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

/**
 * Deep-transform all keys of an object from camelCase to snake_case.
 * Only transforms plain object keys — primitives, arrays, Dates, and other
 * non-plain objects are passed through as values.
 */
export function toSnakeCase(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map((item) => toSnakeCase(item))
  if (!isPlainObject(obj)) return obj

  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[toSnakeCaseKey(key)] = toSnakeCase(value)
  }
  return result
}

/**
 * Deep-transform all keys of an object from snake_case to camelCase.
 * Only transforms plain object keys — primitives, arrays, Dates, and other
 * non-plain objects are passed through as values.
 */
export function toCamelCase(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map((item) => toCamelCase(item))
  if (!isPlainObject(obj)) return obj

  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[toCamelCaseKey(key)] = toCamelCase(value)
  }
  return result
}

/**
 * Format a date string as a relative time string in the given locale.
 * Uses Intl.RelativeTimeFormat (no external library).
 */
export function formatRelativeTime(dateString: string, locale = 'fr'): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const timestamp = new Date(dateString).getTime()
  if (Number.isNaN(timestamp)) return dateString
  const diffMs = Date.now() - timestamp
  const diffSec = Math.round(diffMs / 1000)

  if (diffSec < 60) return rtf.format(-diffSec, 'second')
  const diffMin = Math.round(diffSec / 60)
  if (diffMin < 60) return rtf.format(-diffMin, 'minute')
  const diffHour = Math.round(diffMin / 60)
  if (diffHour < 24) return rtf.format(-diffHour, 'hour')
  const diffDay = Math.round(diffHour / 24)
  if (diffDay < 30) return rtf.format(-diffDay, 'day')
  const diffMonth = Math.round(diffDay / 30)
  if (diffMonth < 12) return rtf.format(-diffMonth, 'month')
  const diffYear = Math.round(diffDay / 365)
  return rtf.format(-diffYear, 'year')
}

/**
 * Format a duration in seconds to a human-readable string.
 * @param seconds - Duration in seconds
 * @param includeSeconds - Whether to include seconds (default: true for detail, false for list)
 * @returns Formatted string like "2h 30min" or "2h 30min 15s"
 */
export function formatDuration(seconds: number, includeSeconds = true): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  if (h > 0) {
    return includeSeconds ? `${h}h ${m}min ${s}s` : `${h}h ${m}min`
  }
  if (m > 0) {
    return includeSeconds ? `${m}min ${s}s` : `${m}min`
  }
  return includeSeconds ? `${s}s` : `${s}s`
}
