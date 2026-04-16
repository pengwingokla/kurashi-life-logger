'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MatchaLog, MatchaCollection } from '@/lib/supabase'

const GRAM_PRESETS = [2, 3, 4]

type Props = {
  log: MatchaLog
  collection: Pick<MatchaCollection, 'id' | 'name' | 'brand' | 'grade'>[]
  date: string
}

export default function LogActions({ log, collection, date }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [grams, setGrams] = useState<number>(log.grams)
  const [matchaId, setMatchaId] = useState<string | null>(log.matcha_id)
  const [saving, setSaving] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this log?')) return
    await fetch(`/api/logs/${log.id}`, { method: 'DELETE' })
    router.refresh()
  }

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/logs/${log.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grams, matcha_id: matchaId }),
    })
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  if (editing) {
    return (
      <div className="mt-3 flex flex-col gap-3 pt-3 border-t border-stone-100 dark:border-stone-700">
        {/* Matcha selector */}
        <div className="flex flex-col gap-1">
          <p className="text-xs text-stone-400">Matcha</p>
          <select
            value={matchaId ?? ''}
            onChange={(e) => setMatchaId(e.target.value || null)}
            className="bg-stone-100 dark:bg-stone-700 rounded-lg px-3 py-2 text-sm outline-none"
          >
            {collection.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        {/* Gram presets */}
        <div className="flex flex-col gap-1">
          <p className="text-xs text-stone-400">Grams</p>
          <div className="flex gap-2">
            {GRAM_PRESETS.map((g) => (
              <button
                key={g}
                onClick={() => setGrams(g)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  grams === g
                    ? 'bg-green-500 text-white'
                    : 'bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                }`}
              >
                {g}g
              </button>
            ))}
            <input
              type="number"
              value={grams}
              onChange={(e) => setGrams(parseFloat(e.target.value))}
              step="0.5"
              min="0.5"
              className="flex-1 bg-stone-100 dark:bg-stone-700 rounded-lg px-2 py-2 text-sm text-center outline-none"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setEditing(false)}
            className="flex-1 py-2 rounded-lg text-sm text-stone-500 bg-stone-100 dark:bg-stone-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 rounded-lg text-sm font-semibold text-white bg-green-500 disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 mt-2">
      <button
        onClick={() => setEditing(true)}
        className="text-xs text-stone-400 hover:text-stone-600"
      >
        Edit
      </button>
      <button
        onClick={handleDelete}
        className="text-xs text-red-400 hover:text-red-600"
      >
        Delete
      </button>
    </div>
  )
}
