'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthProvider'

// Wrap a page in this to keep logged-out visitors out of it. Children are only
// mounted once there's a session, so they never fetch data without a token.
export default function RequireAuth({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { session, role, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace('/login')
    }
  }, [isLoading, session, router])

  if (isLoading || !session) {
    return (
      <p className="p-6 text-center text-zinc-600 dark:text-zinc-400">
        Loading...
      </p>
    )
  }

  return (
    <>
      <div className="flex w-full items-center justify-end gap-3 bg-zinc-50 px-6 pt-4 text-sm text-zinc-600 dark:bg-black dark:text-zinc-400">
        <span>{session.user.email}</span>
        <span className="rounded-full bg-black/[.06] px-2 py-0.5 text-xs dark:bg-white/[.08]">
          {role}
        </span>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="underline"
        >
          Log out
        </button>
      </div>
      {children}
    </>
  )
}
