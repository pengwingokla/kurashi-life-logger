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
      <div className="mt-3 flex flex-col gap-3 pt-3 border-t-2 border-black">
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-widest text-gray-400">Matcha</p>
          <select
            value={matchaId ?? ''}
            onChange={(e) => setMatchaId(e.target.value || null)}
            className="border-2 border-black rounded-xl px-3 py-2 text-base outline-none bg-white"
          >
            {collection.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-widest text-gray-400">Grams</p>
          <div className="flex gap-2">
            {GRAM_PRESETS.map((g) => (
              <button
                key={g}
                onClick={() => setGrams(g)}
                className={`flex-1 py-2 rounded-full border-2 border-black font-bold transition-all ${
                  grams === g
                    ? 'bg-black text-white'
                    : 'bg-white shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5'
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
              className="flex-1 border-2 border-black rounded-xl px-2 py-2 text-center outline-none text-base"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setEditing(false)}
            className="flex-1 py-2 rounded-full border-2 border-black text-sm font-bold shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 rounded-full border-2 border-black text-sm font-bold bg-black text-white disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Save →'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-4 mt-2">
      <button onClick={() => setEditing(true)} className="text-sm text-gray-400 underline underline-offset-2 hover:text-black">
        Edit
      </button>
      <button onClick={handleDelete} className="text-sm text-red-400 underline underline-offset-2 hover:text-red-600">
        Delete
      </button>
    </div>
  )
}
