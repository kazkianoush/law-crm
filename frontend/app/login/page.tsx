'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '../components/AuthProvider'
import { errorMessage } from '../lib/api'
import { supabase } from '../lib/supabase'

const inputClass =
  'w-full rounded-md border border-black/[.15] bg-white px-3 py-2 text-black dark:border-white/[.2] dark:bg-zinc-900 dark:text-zinc-50'

export default function LoginPage() {
  const router = useRouter()
  const { session } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Already logged in (or just logged in): go to the tasks page.
  useEffect(() => {
    if (session) {
      router.replace('/tasks')
    }
  }, [session, router])

  async function handleAuth(mode: 'signin' | 'signup') {
    setIsSubmitting(true)
    setMessage(null)
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        // the effect above redirects once the session arrives
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (!data.session) {
          // Email confirmation is switched on in Supabase
          setMessage({
            type: 'success',
            text: 'Account created. Check your email to confirm it, then sign in.',
          })
        }
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: errorMessage(err, 'Something went wrong'),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-3xl font-semibold text-black dark:text-zinc-50">
          Log in
        </h1>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleAuth('signin')
          }}
          className="flex flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-zinc-950"
        >
          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Email
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Password
            <input
              required
              type="password"
              minLength={6}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </label>

          {message && (
            <p
              role="status"
              className={`text-sm ${
                message.type === 'success'
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {message.text}
            </p>
          )}

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-black"
            >
              {isSubmitting ? 'Please wait...' : 'Sign in'}
            </button>
            <button
              type="button"
              disabled={isSubmitting || !email || password.length < 6}
              onClick={() => handleAuth('signup')}
              className="text-sm text-zinc-600 hover:underline disabled:opacity-50 dark:text-zinc-400"
            >
              Create account
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
