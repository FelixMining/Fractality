interface RetryOptions {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs: number
  jitter: boolean
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 5,
  baseDelayMs: 1000,
  maxDelayMs: 60_000,
  jitter: true,
}

function calculateDelay(attempt: number, options: RetryOptions): number {
  const exponential = options.baseDelayMs * Math.pow(2, attempt)
  const capped = Math.min(exponential, options.maxDelayMs)
  if (options.jitter) {
    return Math.floor(Math.random() * capped)
  }
  return capped
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retries an async function with exponential backoff + jitter.
 * Throws after all retries are exhausted.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: Partial<RetryOptions>,
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options }
  let lastError: unknown

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt < opts.maxRetries) {
        const delay = calculateDelay(attempt, opts)
        console.warn(
          `[SyncEngine] Attempt ${attempt + 1}/${opts.maxRetries} failed. Retrying in ${delay}ms...`,
        )
        await wait(delay)
      }
    }
  }

  throw lastError
}
