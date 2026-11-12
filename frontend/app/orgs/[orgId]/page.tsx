'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import InviteMemberRow from '../../components/InviteMemberRow'
import MemberList, { type Member } from '../../components/MemberList'
import RequireAuth from '../../components/RequireAuth'
import { useAuth } from '../../components/AuthProvider'
import { apiFetch, responseError } from '../../lib/api'
import { useOrg, useOrgMembers } from '../../lib/useOrgMembers'

// Page for one organization. Layout only: data comes from hooks in app/lib/,
// and each region below is a component that can be filled in independently.
export default function OrgPage() {
  const { orgId } = useParams<{ orgId: string }>() // from the URL: /orgs/[orgId]
  const { session } = useAuth()

  // --- data (one hook per resource; add more here later) ---------------------
  const { members, isLoading: membersLoading, error: membersError, refetch: refetchMembers } = useOrgMembers(orgId)
  const { org, isLoading: orgLoading, error: orgError } = useOrg(orgId) // name, my role
  // TODO later: const clients = useOrgClients(orgId)
  // TODO later: const cases = useOrgCases(orgId)

  // Called by the invite row's Send button. The backend checks that the email
  // belongs to an existing account; it throws (with the backend's message) if not.
  async function inviteMember(email: string) {
    const res = await apiFetch(`/orgs/${orgId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (!res.ok) throw await responseError(res, 'Failed to add member')
    refetchMembers()
  }

  // Called when an owner picks a new role in a member's dropdown. Throws with the
  // backend's message on failure (e.g. "An organization needs at least one owner").
  async function changeRole(member: Member, role: string) {
    const res = await apiFetch(`/orgs/${orgId}/members/${member.user_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    if (!res.ok) throw await responseError(res, 'Failed to change role')
    refetchMembers()
  }

  return (
    <RequireAuth>
      <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black md:flex-row">
        {/* LEFT: sidebar. Members now; invite button etc. can go here later. */}
        <aside className="w-full shrink-0 border-b border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-zinc-950 md:w-72 md:border-r md:border-b-0">
          <MemberList
            members={members}
            isLoading={membersLoading}
            error={membersError}
            canEditRoles={org?.role === 'owner'}
            currentUserId={session?.user.id}
            onChangeRole={changeRole}
          />
          {/* Grayed-out row right under the last member.
              TODO: show only to owners/admins (org?.role); the backend already enforces it. */}
          <InviteMemberRow onSend={inviteMember} />
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
