'use client'

import { useEffect, useState } from 'react'
import type { Member } from '../components/MemberList'
import { apiFetch, errorMessage, responseError } from './api'



// Shape returned by GET /orgs/:orgId
export type OrgInfo = {
  id: string
  name: string
  role: 'owner' | 'admin' | 'member' | string
}

// Hook names must start with "use" or React won't let them use state/effects.
// Usage: const { org, isLoading, error } = useOrg(orgId)   // org?.name, org?.role
export function useOrg(orgId: string) {
  const [org, setOrg] = useState<OrgInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrg() {
      try {
        const res = await apiFetch(`/orgs/${orgId}`)
        if (!res.ok) {
          throw await responseError(res, 'Failed to fetch org')
        }
        setOrg(await res.json())
      } catch (err) {
        setError(errorMessage(err, 'Failed to fetch org'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrg()
  }, [orgId]) // refetch when the org changes

  return { org, isLoading, error }
}



// we want to take orgId because we have to use it when
// fetching members
export function useOrgMembers(orgId: string) {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0) // bump it to refetch (e.g. after adding a member)


  useEffect(() => {
    async function fetchMembers() {
      try {
        // main backend api call
        const res = await apiFetch(`/orgs/${orgId}/members`)
        if (!res.ok) {
          throw await responseError(res, 'Failed to fetch members')
        }
        setMembers(await res.json())
      } catch (err) {
        setError(errorMessage(err, 'Failed to fetch members'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchMembers()
  }, [orgId, reloadKey]) // refetch when the org changes or refetch() is called

  const refetch = () => setReloadKey((k) => k + 1)

  // we then return the memebers to the caller page
  return { members, isLoading, error, refetch }
}

