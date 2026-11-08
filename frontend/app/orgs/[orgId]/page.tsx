'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import RequireAuth from '../../components/RequireAuth'

// Placeholder for the page you open after choosing an organization.
// TODO: fetch the org (GET /orgs/:orgId) and build this out (members, clients, cases).
export default function OrgPage() {
  const { orgId } = useParams<{ orgId: string }>()

  return (
    <RequireAuth>
      <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
        <div className="w-full max-w-md">
          <Link
            href="/orgs"
            className="text-sm text-zinc-600 underline dark:text-zinc-400"
          >
            &larr; All organizations
          </Link>
          <h1 className="mt-4 text-3xl font-semibold text-black dark:text-zinc-50">
            Organization
          </h1>
          <p className="mt-2 break-all text-zinc-600 dark:text-zinc-400">
            id: {orgId}
          </p>
          <Link
            href="/tasks"
            className="mt-6 inline-block text-zinc-950 underline dark:text-zinc-50"
          >
            Go to tasks
          </Link>
        </div>
      </div>
    </RequireAuth>
  )
}
