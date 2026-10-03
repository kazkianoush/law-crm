'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { API_URL, errorMessage, responseError } from '../lib/api'

type User = {
  id: string
  name: string
}

const STATUSES = ['Not Completed', 'Completed']

const inputClass =
  'w-full rounded-md border border-black/[.15] bg-white px-3 py-2 text-black dark:border-white/[.2] dark:bg-zinc-900 dark:text-zinc-50'

export default function AddTaskPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [status, setStatus] = useState(STATUSES[0])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch(`${API_URL}/users`)
        if (!res.ok) {
          throw await responseError(res, 'Failed to fetch users')
        }
        const data: User[] = await res.json()
        setUsers(data)
        setUserId((current) => current || data[0]?.id || '')
      } catch (err) {
        setFormError(errorMessage(err, 'Failed to fetch users'))
      } finally {
        setUsersLoading(false)
      }
    }

    fetchUsers()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError(null)
    try {
      const res = await fetch(`${API_URL}/users/${userId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || null,
          status,
          due_date: dueDate,
        }),
      })
      if (!res.ok) {
        throw await responseError(res, 'Failed to create task')
      }
      router.push('/tasks')
    } catch (err) {
      setFormError(errorMessage(err, 'Failed to create task'))
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="w-full max-w-2xl">
        <h1 className="mb-8 text-3xl font-semibold text-black dark:text-zinc-50">
          New task
        </h1>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-zinc-950"
        >
          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            User
            <select
              required
              value={userId}
              disabled={usersLoading}
              onChange={(e) => setUserId(e.target.value)}
              className={inputClass}
            >
              {usersLoading && <option value="">Loading users...</option>}
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Title
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Description
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
            />
          </label>

          <div className="flex gap-4">
            <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
              Due date
              <input
                required
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
              Status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={inputClass}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {formError && (
            <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
          )}

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={isSubmitting || !userId}
              className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-black"
            >
              {isSubmitting ? 'Adding...' : 'Add task'}
            </button>
            <Link
              href="/tasks"
              className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
