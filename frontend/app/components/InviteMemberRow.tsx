'use client'

import { useState } from 'react'
import { errorMessage } from '../lib/api'

type Props = {
  // Does the work (talks to the backend). It should throw an Error with a
  // readable message on failure; that message is shown under the email box.
  onSend: (email: string) => Promise<void>
}

// A grayed-out row that sits right under the member list.
// Click it to reveal an email box and a Send button.
export default function InviteMemberRow({ onSend }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function close() {
    setIsOpen(false)
    setEmail('')
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSending(true)
    setError(null)
    try {
      await onSend(email.trim())
      close() // success: the new member shows up in the list above
    } catch (err) {
      setError(errorMessage(err, 'Could not add member'))
    } finally {
      setIsSending(false)
    }
  }

  // Closed: looks like a faded member row
  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-1 flex w-full items-center gap-3 rounded-md px-2 py-2 text-left opacity-60 transition-opacity hover:bg-black/[.04] hover:opacity-100 dark:hover:bg-white/[.06]"
      >
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dashed border-zinc-400 text-lg leading-none text-zinc-500 dark:border-zinc-500 dark:text-zinc-400"
        >
          +
        </span>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          Invite someone
        </span>
      </button>
    )
  }

  // Open: email box + Send
  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(e) => e.key === 'Escape' && close()}
      className="mt-1 flex flex-col gap-2 rounded-md border border-dashed border-zinc-400 p-3 dark:border-zinc-500"
    >
      <label
        htmlFor="invite-email"
        className="text-xs text-zinc-500 dark:text-zinc-400"
      >
        Email address
      </label>
      <input
        id="invite-email"
        type="email"
        required
        autoFocus
        placeholder="name@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-md border border-black/[.15] bg-white px-3 py-2 text-sm text-black dark:border-white/[.2] dark:bg-zinc-900 dark:text-zinc-50"
      />
      {error && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={close}
          className="rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:bg-black/[.04] dark:text-zinc-400 dark:hover:bg-white/[.06]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSending}
          className="rounded-md bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
        >
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </form>
  )
}
