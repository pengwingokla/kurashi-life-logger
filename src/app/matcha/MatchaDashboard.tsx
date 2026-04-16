'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StreakHeatmap from '@/components/StreakHeatmap'
import MatchaAreaChart from '@/components/MatchaAreaChart'
import LogActions from './LogActions'
import { MatchaLog, MatchaCollection } from '@/lib/supabase'
import { toETDateKey, todayET, formatTimeET24h, formatDateLabel, etTimeToUTC } from '@/lib/time'

const GRAM_PRESETS = [2, 3, 4]

type Props = {
  logs: MatchaLog[]
  collection: Pick<MatchaCollection, 'id' | 'name' | 'brand' | 'grade'>[]
}

function calcStreak(logs: MatchaLog[]): number {
  const loggedDays = new Set(logs.map((l) => toETDateKey(new Date(l.logged_at))))
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 84; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (loggedDays.has(toETDateKey(d))) streak++
    else break
  }
  return streak
}

export default function MatchaDashboard({ logs, collection: initialCollection }: Props) {
  const router = useRouter()
  const today = todayET()
  const [selectedDate, setSelectedDate] = useState(today)

  const [collection, setCollection] = useState(initialCollection)
  const defaultMatcha = collection[0]?.id ?? null
  const [selectedMatchaId, setSelectedMatchaId] = useState<string | null>(defaultMatcha)
  const [grams, setGrams] = useState(3)
  const [useCustom, setUseCustom] = useState(false)
  const [customGrams, setCustomGrams] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Add new matcha inline
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
      setCollection((prev) => [...prev, added])
      setSelectedMatchaId(added.id)
      setNewName('')
      setNewBrand('')
      setAddingMatcha(false)
    } catch {
      setAddError('Failed to add.')
    } finally {
      setAddingSaving(false)
    }
  }

  const isToday = selectedDate === today
  const selectedLogs = logs.filter((l) => toETDateKey(new Date(l.logged_at)) === selectedDate)
  const todayLogs = logs.filter((l) => toETDateKey(new Date(l.logged_at)) === today)
  const todayGrams = todayLogs.reduce((s, l) => s + l.grams, 0)
  const streak = calcStreak(logs)

  async function handleLog() {
    const finalGrams = useCustom ? parseFloat(customGrams) : grams
    if (!finalGrams || finalGrams <= 0) { setError('Enter a valid gram amount'); return }
    if (!selectedMatchaId) { setError('Select a matcha'); return }
    setSaving(true)
    setError('')
    try {
      const logged_at = isToday
        ? new Date().toISOString()
        : etTimeToUTC(selectedDate, '12:00')
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matcha_id: selectedMatchaId, grams: finalGrams, logged_at }),
      })
      if (!res.ok) throw new Error()
      router.refresh()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Heatmap */}
      <div className="washi-card p-4 overflow-x-auto">
        <StreakHeatmap logs={logs} selectedDate={selectedDate} onDayClick={setSelectedDate} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="washi-card p-4">
          <p className="t-label">Today</p>
          <p className="t-stat mt-1">
            {todayLogs.length}
            <span className="t-body ml-1">{todayLogs.length === 1 ? 'cup' : 'cups'}</span>
          </p>
          {todayGrams > 0 && <p className="t-body mt-1">{todayGrams}g total</p>}
        </div>
        <div className="washi-card p-4">
          <p className="t-label">Streak</p>
          <p className="t-stat mt-1">
            {streak}
            <span className="t-body ml-1">{streak === 1 ? 'day' : 'days'}</span>
          </p>
        </div>
      </div>

      {/* Area chart */}
      <MatchaAreaChart logs={logs} />

      {/* Inline log form */}
      <div className="washi-card p-4 flex flex-col gap-3">
        <p className="t-label">
          Log for {isToday ? 'today' : formatDateLabel(selectedDate)}
        </p>

        <select
          value={selectedMatchaId ?? ''}
          onChange={(e) => setSelectedMatchaId(e.target.value || null)}
          className="border-2 border-black rounded-xl pl-3 pr-8 py-2 text-sm outline-none shadow-[2px_2px_0px_#1a1008] bg-transparent appearance-none w-full"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\' viewBox=\'0 0 12 8\'%3E%3Cpath d=\'M1 1l5 5 5-5\' stroke=\'%231a1008\' stroke-width=\'2\' fill=\'none\' stroke-linecap=\'round\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
        >
          {collection.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}{m.brand ? ` — ${m.brand}` : ''}
            </option>
          ))}
        </select>

        {!addingMatcha ? (
          <button
            onClick={() => setAddingMatcha(true)}
            className="text-xs text-gray-500 hover:text-black transition-colors self-start"
          >
            + Add new matcha
          </button>
        ) : (
          <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
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
                className="flex-1 py-1 text-sm rounded-full border-2 border-black font-bold bg-black text-white disabled:opacity-40 transition-all"
              >
                {addingSaving ? 'Adding...' : 'Add →'}
              </button>
            </div>
          </div>
        )}

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
                : 'shadow-[2px_2px_0px_#1a1008] placeholder:text-gray-500'
            }`}
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          onClick={handleLog}
          disabled={saving || !selectedMatchaId}
          className="bg-black text-white font-bold text-sm py-2 rounded-full border-2 border-black shadow-[2px_2px_0px_#666] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 disabled:opacity-40 transition-all"
        >
          {saving ? 'Saving...' : 'Confirm →'}
        </button>
      </div>

      {/* Selected day logs */}
      <div className="flex flex-col gap-3">
        <p className="t-label">
          {isToday ? "Today's Logs" : formatDateLabel(selectedDate)}
        </p>
        {selectedLogs.length === 0 ? (
          <p className="t-body">No matcha logged.</p>
        ) : (
          selectedLogs.map((log) => (
            <div key={log.id} className="washi-card px-4 py-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="t-h2">{log.matcha_collection?.name ?? 'Unknown matcha'}</p>
                  {log.matcha_collection?.brand && (
                    <p className="t-body">{log.matcha_collection.brand}</p>
                  )}
                  {log.notes && (
                    <p className="t-body italic mt-0.5">{log.notes}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="t-h2 font-bold">{log.grams}g</p>
                  <p className="t-body">{formatTimeET24h(log.logged_at)}</p>
                </div>
              </div>
              <LogActions log={log} collection={collection} date={selectedDate} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
