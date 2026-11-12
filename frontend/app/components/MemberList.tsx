'use client'

import { useState } from 'react'
import { errorMessage } from '../lib/api'

export const ROLES = ['owner', 'admin', 'member'] as const

// Same shape that GET /orgs/:orgId/members returns.
export type Member = {
  user_id: string
  name: string
  email: string | null
  role: 'owner' | 'admin' | 'member' | string
}

type Props = {
  members: Member[]
  isLoading?: boolean
  error?: string | null
  // Role editing: only pass canEditRoles for owners. The backend enforces it too.
  canEditRoles?: boolean
  currentUserId?: string // your own row stays a plain label (no demoting yourself)
  onChangeRole?: (member: Member, role: string) => Promise<void> // should throw on failure
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}

// Mostly presentational: give it the data, it draws the list. The only state it
// keeps is which row is saving and the last role-change error.
export default function MemberList({
  members,
  isLoading,
  error,
  canEditRoles,
  currentUserId,
  onChangeRole,
}: Props) {
  const [savingId, setSavingId] = useState<string | null>(null)
  const [roleError, setRoleError] = useState<string | null>(null)

  async function changeRole(member: Member, role: string) {
    if (!onChangeRole || role === member.role) return
    setSavingId(member.user_id)
    setRoleError(null)
    try {
      await onChangeRole(member, role)
    } catch (err) {
      setRoleError(errorMessage(err, 'Could not change role'))
    } finally {
      setSavingId(null)
    }
  }

  return (
    <section aria-label="Organization members">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Members{!isLoading && !error ? ` (${members.length})` : ''}
      </h2>

      {isLoading ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading...</p>
      ) : error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : members.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No members yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {members.map((member) => (
            <li
              key={member.user_id}
              className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-black/[.04] dark:hover:bg-white/[.06]"
            >
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/[.08] text-xs font-medium text-zinc-700 dark:bg-white/[.12] dark:text-zinc-200"
              >
                {initials(member.name) || '?'}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-black dark:text-zinc-50">
                  {member.name}
                </span>
                {member.email && (
                  <span className="block truncate text-xs text-zinc-600 dark:text-zinc-400">
                    {member.email}
                  </span>
                )}
              </span>
              {canEditRoles && member.user_id !== currentUserId ? (
                <select
                  aria-label={`Role for ${member.name}`}
                  value={member.role}
                  disabled={savingId === member.user_id}
                  onChange={(e) => changeRole(member, e.target.value)}
                  className="shrink-0 rounded-md border border-black/[.15] bg-white px-1.5 py-0.5 text-xs text-zinc-700 disabled:opacity-60 dark:border-white/[.2] dark:bg-zinc-900 dark:text-zinc-200"
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="shrink-0 rounded-full bg-black/[.06] px-2 py-0.5 text-xs text-zinc-600 dark:bg-white/[.08] dark:text-zinc-400">
                  {member.role}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      {roleError && (
        <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">
          {roleError}
        </p>
      )}
    </section>
  )
}
