import { useEffect } from 'react'
import type { ErrorComponentProps } from '@tanstack/react-router'

// One report per distinct error per page load; the server dedupes further.
const reported = new Set<string>()

export function reportClientError(
  source: string,
  message: string,
  stack?: string,
) {
  if (typeof window === 'undefined') return
  const key = `${source}:${message}`
  if (reported.has(key)) return
  reported.add(key)
  void fetch('/api/client-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, message, stack, url: window.location.href }),
    keepalive: true,
  }).catch(() => {
    // Reporting must never cause its own error noise.
  })
}

/**
 * Global listeners for uncaught errors and unhandled promise rejections.
 * Mounted once in the root document.
 */
export function ClientErrorListener() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      reportClientError(
        'window',
        event.message,
        event.error instanceof Error ? event.error.stack : undefined,
      )
    }
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      reportClientError(
        'unhandledrejection',
        reason instanceof Error ? reason.message : String(reason),
        reason instanceof Error ? reason.stack : undefined,
      )
    }
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])
  return null
}

/**
 * Root route error boundary: reports React render crashes (e.g. the
 * undefined-rates crash) and shows a recoverable fallback instead of a
 * blank page.
 */
export function RouteErrorFallback({ error }: ErrorComponentProps) {
  useEffect(() => {
    reportClientError(
      'render',
      error instanceof Error ? error.message : String(error),
      error instanceof Error ? error.stack : undefined,
    )
  }, [error])

  return (
    <div className="container mx-auto flex flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground">
        The error has been reported. Try reloading the page.
      </p>
      <button
        className="rounded-md border px-4 py-2"
        onClick={() => window.location.reload()}
      >
        Reload
      </button>
    </div>
  )
}
