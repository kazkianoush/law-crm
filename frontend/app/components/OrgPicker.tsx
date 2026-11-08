'use client'

import Link from 'next/link'
import { useAuth } from './AuthProvider'

type Org = {
  id: string
  name: string
  role: 'owner' | 'admin' | 'member'
}

// TODO: replace with GET /orgs via apiFetch (it returns the user's orgs;
// add `role` to the response if you want the badge below).
// While wiring it up, `isLoading` and `error` below are ready to use.
const PLACEHOLDER_ORGS: Org[] = [
  { id: 'placeholder-1', name: 'Acme Law', role: 'owner' },
  { id: 'placeholder-2', name: 'Smith & Co', role: 'member' },
]

export default function OrgPicker() {
  const { session } = useAuth()

  // TODO: swap these for real state once the fetch exists
  const orgs: Org[] = PLACEHOLDER_ORGS
  const isLoading = false
  const error: string | null = null

  const name = session?.user.email?.split('@')[0] ?? 'there'

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
          Welcome, {name}
        </h1>
        <p className="mt-2 mb-8 text-zinc-600 dark:text-zinc-400">
          Choose an organization to continue.
        </p>

        {isLoading ? (
          <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
        ) : error ? (
          <p role="alert" className="text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : orgs.length === 0 ? (
          <p className="rounded-lg border border-black/[.08] bg-white p-4 text-zinc-600 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-400">
            You&apos;re not in any organization yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {orgs.map((org) => (
              <li key={org.id}>
                <Link
                  href={`/orgs/${org.id}`}
                  className="flex items-center justify-between rounded-lg border border-black/[.08] bg-white p-4 text-black transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-[#1a1a1a]"
                >
                  <span className="font-medium">{org.name}</span>
                  <span className="rounded-full bg-black/[.06] px-2 py-0.5 text-xs text-zinc-600 dark:bg-white/[.08] dark:text-zinc-400">
                    {org.role}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
