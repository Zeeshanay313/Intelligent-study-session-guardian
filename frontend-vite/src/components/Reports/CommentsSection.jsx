import React, { useState } from 'react'
import Button from '../UI/Button'
import api from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

const CommentsSection = ({ sessionId, comments, onCommentSaved }) => {
  const { user } = useAuth()
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const role = user?.user?.role || user?.role || 'user'
  const canComment = role === 'teacher' || role === 'coach' || role === 'admin'

  const handleSubmit = async () => {
    if (!text.trim() || !sessionId) return
    setSaving(true)
    try {
      await api.reports.addComment(sessionId, text.trim())
      setText('')
      if (onCommentSaved) {
        onCommentSaved(sessionId)
      }
    } catch (error) {
      console.error('Failed to save comment:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-700/40 bg-white dark:bg-gray-800/60 p-6 shadow-card">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Coach Comments</h3>
      {canComment && (
        <div className="mb-4">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-100 dark:border-gray-700/40 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            placeholder="Add feedback for this session"
          />
          <div className="mt-2 flex justify-end">
            <Button onClick={handleSubmit} loading={saving}>Post Comment</Button>
          </div>
        </div>
      )}
      {comments.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet.</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment._id} className="rounded-xl border border-gray-100 dark:border-gray-700/40 bg-gray-50 dark:bg-gray-900/40 p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {comment.userId?.profile?.displayName || 'Coach'} · {new Date(comment.createdAt).toLocaleString()}
              </div>
              <div className="mt-1 text-sm text-gray-800 dark:text-gray-200">{comment.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CommentsSection
