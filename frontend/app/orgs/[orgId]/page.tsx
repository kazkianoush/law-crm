'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import MemberList from '../../components/MemberList'
import RequireAuth from '../../components/RequireAuth'
import { useOrg, useOrgMembers } from '../../lib/useOrgMembers'

// Page for one organization. Layout only: data comes from hooks in app/lib/,
// and each region below is a component that can be filled in independently.
export default function OrgPage() {
  const { orgId } = useParams<{ orgId: string }>() // from the URL: /orgs/[orgId]

  // --- data (one hook per resource; add more here later) ---------------------
  const { members, isLoading: membersLoading, error: membersError } = useOrgMembers(orgId)
  const { org, isLoading: orgLoading, error: orgError } = useOrg(orgId) // name, my role
  // TODO later: const clients = useOrgClients(orgId)
  // TODO later: const cases = useOrgCases(orgId)

  return (
    <RequireAuth>
      <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black md:flex-row">
        {/* LEFT: sidebar. Members now; invite button etc. can go here later. */}
        <aside className="w-full shrink-0 border-b border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-zinc-950 md:w-72 md:border-r md:border-b-0">
          <MemberList members={members} isLoading={membersLoading} error={membersError} />
          {/* TODO later: <InviteMemberButton orgId={orgId} /> (owners/admins only) */}
        </aside>

        {/* RIGHT: main content. */}
        <main className="flex-1 px-6 py-8">
          <Link
            href="/orgs"
            className="text-sm text-zinc-600 underline dark:text-zinc-400"
          >
            &larr; All organizations
          </Link>

          {/* Header: the org's name (falls back to "Organization" while loading) */}
          <h1 className="mt-4 text-3xl font-semibold text-black dark:text-zinc-50">
            {orgLoading ? 'Loading...' : (org?.name ?? 'Organization')}
          </h1>
          {orgError && (
            <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
              {orgError}
            </p>
          )}
          <p className="mt-2 break-all text-sm text-zinc-600 dark:text-zinc-400">
            id: {orgId}
          </p>

          {/* Sections: add clients / cases / tasks panels here as they get built. */}
          <section className="mt-8 rounded-lg border border-dashed border-black/[.15] p-6 text-sm text-zinc-600 dark:border-white/[.2] dark:text-zinc-400">
            Clients, cases and tasks will appear here.
          </section>
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
