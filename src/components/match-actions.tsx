'use client'

import { useState, useTransition } from 'react'
import { cancelMatch, joinMatch, leaveMatch } from '@/lib/actions/matches'

type Props = {
  matchId: string
  isHost: boolean
  isJoined: boolean
  isFull: boolean
  isClosed: boolean // cancelled, or already started
}

export function MatchActions({ matchId, isHost, isJoined, isFull, isClosed }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const run = (fn: () => Promise<{ error?: string; ok?: boolean }>) => {
    setError(null)
    startTransition(async () => {
      const res = await fn()
      if (res?.error) setError(res.error)
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {!isClosed && !isJoined && (
          <button
            disabled={pending || isFull}
            onClick={() => run(() => joinMatch(matchId))}
            className="btn-primary flex-1"
          >
            {isFull ? 'Match is full' : pending ? 'Joining…' : 'Join this match'}
          </button>
        )}

        {!isClosed && isJoined && !isHost && (
          <button disabled={pending} onClick={() => run(() => leaveMatch(matchId))} className="btn-ghost flex-1">
            {pending ? 'Working…' : 'Leave match'}
          </button>
        )}

        {!isClosed && isHost && (
          <button disabled={pending} onClick={() => run(() => cancelMatch(matchId))} className="btn-danger flex-1">
            {pending ? 'Working…' : 'Cancel this match'}
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
