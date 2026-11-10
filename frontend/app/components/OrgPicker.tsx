'use client'

import Link from 'next/link'
import { useAuth } from './AuthProvider'
import { useEffect, useState } from 'react'
import { apiFetch, errorMessage, responseError } from '../lib/api'

type Org = {
  id: string
  name: string
  // GET /orgs doesn't return a role yet; the badge only shows when it does
  role?: 'owner' | 'admin' | 'member'
}

export default function OrgPicker() {
  const { session } = useAuth()
  const [orgs, setOrgs] = useState<Org[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // fetch orgs is used to get the organization(s) of a user
  useEffect(() => {
    async function fetchOrgs() {
      try {
        const res = await apiFetch('/orgs')
        if (!res.ok) {
          throw await responseError(res, 'Failed to fetch orgs')
        }
        setOrgs(await res.json())
      } catch (err) {
        setError(errorMessage(err, 'Failed to fetch orgs'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrgs()
  }, [])

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
                  {org.role && (
                    <span className="rounded-full bg-black/[.06] px-2 py-0.5 text-xs text-zinc-600 dark:bg-white/[.08] dark:text-zinc-400">
                      {org.role}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
