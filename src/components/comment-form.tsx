'use client'

import { useActionState, useEffect, useRef } from 'react'
import { postComment } from '@/lib/actions/matches'
import { SubmitButton } from '@/components/submit-button'

export function CommentForm({ matchId }: { matchId: string }) {
  const action = postComment.bind(null, matchId)
  const [state, formAction] = useActionState(action, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.ok) formRef.current?.reset()
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <textarea
        name="body"
        rows={2}
        maxLength={500}
        required
        className="field resize-none"
        placeholder="Ask a question, or say when you'll get there…"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex justify-end">
        <SubmitButton className="btn-primary" pendingText="Sending…">
          Send
        </SubmitButton>
      </div>
    </form>
  )
}
