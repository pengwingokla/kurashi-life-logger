'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MatchaLog, MatchaCollection } from '@/lib/supabase'
import { formatTimeET24h, etTimeToUTC } from '@/lib/time'

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
  const isPreset = GRAM_PRESETS.includes(log.grams)
  const [useCustom, setUseCustom] = useState(!isPreset)
  const [customGrams, setCustomGrams] = useState(!isPreset ? String(log.grams) : '')
  const [matchaId, setMatchaId] = useState<string | null>(log.matcha_id)
  const [time, setTime] = useState<string>(formatTimeET24h(log.logged_at))
  const [saving, setSaving] = useState(false)
  const [localCollection, setLocalCollection] = useState(collection)
  const [addingMatcha, setAddingMatcha] = useState(false)
  const [newName, setNewName] = useState('')
  const [newBrand, setNewBrand] = useState('')
  const [addingSaving, setAddingSaving] = useState(false)
  const [addError, setAddError] = useState('')

  async function handleAddMatcha() {
    if (!newName.trim()) { setAddError('Name is required'); return }
    setAddingSaving(true)
    setAddError('')
    try {
      const res = await fetch('/api/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), brand: newBrand.trim() || null, grade: 'ceremonial' }),
      })
      if (!res.ok) throw new Error()
      const added = await res.json()
      setLocalCollection((prev) => [...prev, added])
      setMatchaId(added.id)
      setNewName('')
      setNewBrand('')
      setAddingMatcha(false)
    } catch {
      setAddError('Failed to add.')
    } finally {
      setAddingSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this log?')) return
    await fetch(`/api/logs/${log.id}`, { method: 'DELETE' })
    router.refresh()
  }

  async function handleSave() {
    const finalGrams = useCustom ? parseFloat(customGrams) : grams
    setSaving(true)
    await fetch(`/api/logs/${log.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grams: finalGrams, matcha_id: matchaId, logged_at: etTimeToUTC(date, time) }),
    })
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  if (editing) {
    return (
      <div className="mt-3 flex flex-col gap-3 pt-3 border-t-2 border-black">
        <div className="flex flex-col gap-1">
          <p className="t-label">Matcha</p>
          <select
            value={matchaId ?? ''}
            onChange={(e) => setMatchaId(e.target.value || null)}
            className="border-2 border-black rounded-xl pl-3 pr-8 py-2 text-sm outline-none shadow-[2px_2px_0px_#1a1008] bg-transparent appearance-none w-full"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\' viewBox=\'0 0 12 8\'%3E%3Cpath d=\'M1 1l5 5 5-5\' stroke=\'%231a1008\' stroke-width=\'2\' fill=\'none\' stroke-linecap=\'round\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
          >
            {localCollection.map((m) => (
              <option key={m.id} value={m.id}>{m.name}{m.brand ? ` — ${m.brand}` : ''}</option>
            ))}
          </select>

          {!addingMatcha ? (
            <button
              onClick={() => setAddingMatcha(true)}
              className="text-xs text-gray-400 hover:text-black transition-colors self-start mt-1"
            >
              + Add new matcha
            </button>
          ) : (
            <div className="flex flex-col gap-2 pt-2 border-t border-gray-200 mt-1">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Name (required)"
                autoFocus
                className="border-2 border-black rounded-xl px-3 py-1.5 text-sm outline-none focus:shadow-[2px_2px_0px_#000]"
              />
              <input
                type="text"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                placeholder="Brand (optional)"
                className="border-2 border-black rounded-xl px-3 py-1.5 text-sm outline-none focus:shadow-[2px_2px_0px_#000]"
              />
              {addError && <p className="text-red-500 text-xs">{addError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => { setAddingMatcha(false); setNewName(''); setNewBrand(''); setAddError('') }}
                  className="flex-1 py-1 text-sm rounded-full border-2 border-black font-bold shadow-[2px_2px_0px_#1a1008] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMatcha}
                  disabled={addingSaving}
                  className="flex-1 py-1 text-sm rounded-full border-2 border-black font-bold bg-black text-white disabled:opacity-40"
                >
                  {addingSaving ? 'Adding...' : 'Add →'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <p className="t-label">Grams</p>
          <div className="flex gap-1.5 items-center">
            {GRAM_PRESETS.map((g) => (
              <button
                key={g}
                onClick={() => { setGrams(g); setUseCustom(false); setCustomGrams('') }}
                className={`flex-1 py-1 text-sm rounded-full border-2 border-black font-bold transition-all ${
                  !useCustom && grams === g
                    ? 'bg-black text-white shadow-none'
                    : 'shadow-[2px_2px_0px_#1a1008] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5'
                }`}
              >
                {g}g
              </button>
            ))}
            <input
              type="number"
              value={useCustom ? customGrams : ''}
              onChange={(e) => { setCustomGrams(e.target.value); setUseCustom(true) }}
              onFocus={() => setUseCustom(true)}
              placeholder="other"
              step="0.5"
              min="0.5"
              className={`flex-1 py-1 text-sm text-center rounded-full border-2 border-black font-bold outline-none transition-all ${
                useCustom
                  ? 'bg-black text-white shadow-none'
                  : 'shadow-[2px_2px_0px_#1a1008] placeholder:text-gray-400'
              }`}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <p className="t-label">Time (ET)</p>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="border-2 border-black rounded-xl px-3 py-2 text-base outline-none focus:shadow-[2px_2px_0px_#000] transition-shadow"
          />
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
