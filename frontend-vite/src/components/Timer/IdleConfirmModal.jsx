import React from 'react'
import { useTimer } from '../../contexts/TimerContext'

const IdleConfirmModal = () => {
  const { idlePrompt, confirmIdle, confirmStillActive } = useTimer()

  if (!idlePrompt.show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900">Still studying?</h2>
        <p className="mt-2 text-sm text-gray-600">
          We have not detected activity for {Math.floor(idlePrompt.idleSeconds || 0)} seconds.
          Should we keep the timer running?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:border-gray-300"
            onClick={confirmIdle}
          >
            Pause
          </button>
          <button
            type="button"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            onClick={confirmStillActive}
          >
            I am active
          </button>
        </div>
      </div>
    </div>
  )
}

export default IdleConfirmModal
