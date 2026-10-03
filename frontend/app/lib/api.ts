export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

// fetch() rejects with a TypeError when the server can't be reached at all.
export function errorMessage(err: unknown, fallback: string) {
  if (err instanceof TypeError) {
    return "Can't reach the server. Is the backend running?"
  }
  return err instanceof Error ? err.message : fallback
}

// Prefer the backend's own { error } message when it sent one.
export async function responseError(res: Response, fallback: string) {
  try {
    const body = await res.json()
    if (typeof body?.error === 'string') {
      return new Error(body.error)
    }
  } catch {}
  return new Error(fallback)
}
