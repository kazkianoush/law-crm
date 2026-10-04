'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiFetch, errorMessage, responseError } from '../lib/api'

type Task = {
  id: string
  title: string
  description: string | null
  status: string
  due_date: string
}

const STATUSES = ['Not Completed', 'Completed']

const inputClass =
  'w-full rounded-md border border-black/[.15] bg-white px-3 py-2 text-black dark:border-white/[.2] dark:bg-zinc-900 dark:text-zinc-50'

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
  // for editing purposes
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState({ title: '', description: '', dueDate: '' })

  // for setting and getting cur tasks
  const [tasks, setTasks] = useState<Task[]>([])

  // for setting busy tasks, so they aren't edited mid path
  const [busyId, setBusyId] = useState<string | null>(null)
  
  // for giving user updates
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
        const path = userId ? `/users/${userId}/tasks` : '/tasks'
        const res = await apiFetch(path)
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
      const res = await apiFetch(`/tasks/${task.id}`, {
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

  function startEdit(task: Task) {
    setEditingId(task.id)
    setDraft({
      title: task.title,
      description: task.description ?? '',
      dueDate: task.due_date.slice(0, 10),   // "2026-09-19", avoids timezone shifts
    })
  }

  async function handleSave(task: Task) {
    setBusyId(task.id)
    try {
      const res = await apiFetch(`/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draft.title,
          description: draft.description || null,
          due_date: draft.dueDate,
        }),
      })
      if (!res.ok) {
        throw await responseError(res, 'Failed to update task')
      }
      const updated: Task = await res.json()
      setTasks((current) => current.map((t) => (t.id === task.id ? updated : t)))
      setEditingId(null) // only on success, so a failure keeps what the user typed
      showNotice('success', `Saved "${updated.title}"`)
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
      const res = await apiFetch(`/tasks/${task.id}`, {
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
              {editingId === task.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSave(task)
                  }}
                  className="flex flex-col gap-3"
                >
                  <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
                    Title
                    <input
                      required
                      value={draft.title}
                      onChange={(e) =>
                        setDraft({ ...draft, title: e.target.value })
                      }
                      className={inputClass}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
                    Description
                    <textarea
                      rows={3}
                      value={draft.description}
                      onChange={(e) =>
                        setDraft({ ...draft, description: e.target.value })
                      }
                      className={inputClass}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
                    Due date
                    <input
                      type="date"
                      required
                      value={draft.dueDate}
                      onChange={(e) =>
                        setDraft({ ...draft, dueDate: e.target.value })
                      }
                      className={inputClass}
                    />
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      type="submit"
                      disabled={busyId === task.id}
                      className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-black"
                    >
                      {busyId === task.id ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      disabled={busyId === task.id}
                      className="text-sm text-zinc-600 hover:underline disabled:opacity-50 dark:text-zinc-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-lg font-medium text-black dark:text-zinc-50">
                      {task.title}
                    </h2>
                    <div className="flex shrink-0 items-center gap-2">
                      <select
                        value={normalizeStatus(task.status)}
                        disabled={busyId === task.id}
                        onChange={(e) =>
                          handleStatusChange(task, e.target.value)
                        }
                        className="rounded-md border border-black/[.15] bg-white px-2 py-1 text-sm text-black disabled:opacity-50 dark:border-white/[.2] dark:bg-zinc-900 dark:text-zinc-50"
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
                      <button
                        type="button"
                        onClick={() => startEdit(task)}
                        disabled={busyId === task.id}
                        className="rounded-md border border-black/[.15] px-2 py-1 text-sm text-black hover:bg-black/[.04] disabled:opacity-50 dark:border-white/[.2] dark:text-zinc-50 dark:hover:bg-white/[.08]"
                      >
                        Edit
                      </button>
                    </div>
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
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
