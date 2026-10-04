import { supabase } from './supabase'

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

// fetch() against the backend, with the logged-in user's token attached.
// `path` starts with "/", e.g. apiFetch('/tasks').
export async function apiFetch(path: string, options: RequestInit = {}) {
  // getSession() refreshes the token automatically if it has expired
  const { data } = await supabase.auth.getSession()
  const headers = new Headers(options.headers)
  if (data.session) {
    headers.set('Authorization', `Bearer ${data.session.access_token}`)
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (res.status === 401) {
    // Token rejected: sign out, and RequireAuth sends the user to /login
    await supabase.auth.signOut()
  }
  return res
}

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
