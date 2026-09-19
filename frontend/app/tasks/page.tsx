'use client'

import { useEffect, useState } from 'react'

type Task = {
  id: string
  title: string
  description: string | null
  status: string
  due_date: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTasks() {
      try {
        const res = await fetch(`${API_URL}/tasks`)
        if (!res.ok) {
          throw new Error('Failed to fetch tasks')
        }
        const data = await res.json()
        setTasks(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tasks')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [])

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="w-full max-w-2xl">
        <h1 className="mb-8 text-3xl font-semibold text-black dark:text-zinc-50">
          Tasks
        </h1>

        {isLoading && (
          <p className="text-zinc-600 dark:text-zinc-400">Loading tasks...</p>
        )}

        {error && <p className="text-red-600 dark:text-red-400">{error}</p>}

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
                <span className="shrink-0 rounded-full bg-black/[.06] px-2.5 py-0.5 text-sm text-zinc-700 dark:bg-white/[.08] dark:text-zinc-300">
                  {task.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Due {new Date(task.due_date).toLocaleDateString()}
              </p>
              {task.description && (
                <p className="mt-2 text-zinc-700 dark:text-zinc-300">
                  {task.description}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
