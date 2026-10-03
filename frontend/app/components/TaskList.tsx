'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { API_URL, errorMessage, responseError } from '../lib/api'

type Task = {
  id: string
  title: string
  description: string | null
  status: string
  due_date: string
}

const STATUSES = ['Not Completed', 'Completed']

// Existing rows may have stray spaces or different casing ("  Completed",
// "not completed"); map them onto the dropdown's canonical values.
function normalizeStatus(status: string) {
  const trimmed = status.trim()
  return (
    STATUSES.find((s) => s.toLowerCase() === trimmed.toLowerCase()) ?? trimmed
  )
}

type TaskListProps = {
  // When set, only that user's tasks are shown; otherwise all tasks.
  userId?: string
}

export default function TaskList({ userId }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    async function fetchTasks() {
      try {
        const url = userId
          ? `${API_URL}/users/${userId}/tasks`
          : `${API_URL}/tasks`
        const res = await fetch(url)
        if (!res.ok) {
          throw await responseError(res, 'Failed to fetch tasks')
        }
        const data = await res.json()
        setTasks(data)
      } catch (err) {
        setError(errorMessage(err, 'Failed to fetch tasks'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [userId, reloadKey])

  function retry() {
    setError(null)
    setIsLoading(true)
    setReloadKey((k) => k + 1)
  }

  function showNotice(type: 'success' | 'error', message: string) {
    setNotice({ type, message })
    setTimeout(() => setNotice(null), 3000)
  }

  async function handleStatusChange(task: Task, newStatus: string) {
    setBusyId(task.id)
    try {
      const res = await fetch(`${API_URL}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        throw await responseError(res, 'Failed to update task')
      }
      const updated: Task = await res.json()
      setTasks((current) => current.map((t) => (t.id === task.id ? updated : t)))
      showNotice('success', `"${task.title}" marked ${normalizeStatus(updated.status)}`)
    } catch (err) {
      showNotice('error', errorMessage(err, 'Failed to update task'))
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(task: Task) {
    if (!window.confirm(`Delete "${task.title}"?`)) {
      return
    }
    setBusyId(task.id)
    try {
      const res = await fetch(`${API_URL}/tasks/${task.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        throw await responseError(res, 'Failed to delete task')
      }
      setTasks((current) => current.filter((t) => t.id !== task.id))
      showNotice('success', `Deleted "${task.title}"`)
    } catch (err) {
      showNotice('error', errorMessage(err, 'Failed to delete task'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
            Tasks
          </h1>
          <Link
            href="/addtasks"
            className="rounded-md bg-black px-4 py-2 text-white dark:bg-zinc-50 dark:text-black"
          >
            Add task
          </Link>
        </div>

        {notice && (
          <p
            role="status"
            className={`mb-4 rounded-md px-3 py-2 text-sm ${
              notice.type === 'success'
                ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
            }`}
          >
            {notice.message}
          </p>
        )}

        {isLoading && (
          <p className="text-zinc-600 dark:text-zinc-400">Loading tasks...</p>
        )}

        {error && (
          <div className="flex items-center gap-3">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              type="button"
              onClick={retry}
              className="text-sm text-zinc-700 underline dark:text-zinc-300"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !error && tasks.length === 0 && (
          <p className="text-zinc-600 dark:text-zinc-400">No tasks found.</p>
        )}

        <ul className="flex flex-col gap-4">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="rounded-lg border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-zinc-950"
            >
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-medium text-black dark:text-zinc-50">
                  {task.title}
                </h2>
                <select
                  value={normalizeStatus(task.status)}
                  disabled={busyId === task.id}
                  onChange={(e) => handleStatusChange(task, e.target.value)}
                  className="shrink-0 rounded-md border border-black/[.15] bg-white px-2 py-1 text-sm text-black disabled:opacity-50 dark:border-white/[.2] dark:bg-zinc-900 dark:text-zinc-50"
                >
                  {!STATUSES.includes(normalizeStatus(task.status)) && (
                    <option value={normalizeStatus(task.status)}>
                      {normalizeStatus(task.status)}
                    </option>
                  )}
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Due {new Date(task.due_date).toLocaleDateString()}
              </p>
              {task.description && (
                <p className="mt-2 text-zinc-700 dark:text-zinc-300">
                  {task.description}
                </p>
              )}
              <button
                type="button"
                onClick={() => handleDelete(task)}
                disabled={busyId === task.id}
                className="mt-3 text-sm text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
              >
                {busyId === task.id ? 'Working...' : 'Delete'}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
