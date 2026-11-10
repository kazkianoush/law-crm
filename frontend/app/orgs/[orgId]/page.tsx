'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import MemberList, { type Member } from '../../components/MemberList'
import RequireAuth from '../../components/RequireAuth'

// TODO: replace with the real data from GET /orgs/:orgId/members, e.g.
//   const { members, isLoading, error } = useOrgMembers(orgId)
// MemberList already handles loading, error and empty states.
const PLACEHOLDER_MEMBERS: Member[] = [
  { user_id: '1', name: 'Alice Johnson', email: 'alice@example.com', role: 'owner' },
  { user_id: '2', name: 'Bob Smith', email: 'bob@example.com', role: 'admin' },
  { user_id: '3', name: 'Carol Diaz', email: 'carol@example.com', role: 'member' },
]

export default function OrgPage() {
  const { orgId } = useParams<{ orgId: string }>()

  const members = PLACEHOLDER_MEMBERS
  const isLoading = false
  const error: string | null = null

  return (
    <RequireAuth>
      <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black md:flex-row">
        {/* Left: members */}
        <aside className="w-full shrink-0 border-b border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-zinc-950 md:w-72 md:border-r md:border-b-0">
          <MemberList members={members} isLoading={isLoading} error={error} />
        </aside>

        {/* Right: the rest of the organization page */}
        <main className="flex-1 px-6 py-8">
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
        </main>
      </div>
    </RequireAuth>
  )
}
