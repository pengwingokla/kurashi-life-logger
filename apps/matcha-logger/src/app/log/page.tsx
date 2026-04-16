'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MatchaCollection } from '@/lib/supabase'

const GRAM_PRESETS = [2, 3, 4]

export default function LogPage() {
  const router = useRouter()
  const [collection, setCollection] = useState<MatchaCollection[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [grams, setGrams] = useState<number>(3)
  const [customGrams, setCustomGrams] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [text, setText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/collection')
      .then((r) => r.json())
      .then((data: MatchaCollection[]) => {
        setCollection(data)
        const def = data.find((m) => m.is_default) ?? data[0]
        if (def) setSelectedId(def.id)
      })
  }, [])

  async function handleParseAndLog() {
    if (!text.trim()) return
    setParsing(true)
    setError('')
    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const parsed = await res.json()
      if (parsed.matcha_id) setSelectedId(parsed.matcha_id)
      if (parsed.grams) {
        setGrams(parsed.grams)
        if (!GRAM_PRESETS.includes(parsed.grams)) {
          setUseCustom(true)
          setCustomGrams(String(parsed.grams))
        }
      }
      await saveLog({
        matcha_id: parsed.matcha_id ?? selectedId,
        grams: parsed.grams ?? grams,
        notes: parsed.notes ?? text,
        logged_at: parsed.logged_at,
      })
    } catch {
      setError('Failed to parse. Try the quick-select below.')
    } finally {
      setParsing(false)
    }
  }

  async function handleConfirm() {
    const finalGrams = useCustom ? parseFloat(customGrams) : grams
    if (!finalGrams || finalGrams <= 0) {
      setError('Enter a valid gram amount')
      return
    }
    await saveLog({ matcha_id: selectedId, grams: finalGrams })
  }

  async function saveLog(payload: {
    matcha_id: string | null
    grams: number
    notes?: string | null
    logged_at?: string
  }) {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      router.push('/')
      router.refresh()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100">
      <div className="max-w-md mx-auto px-4 py-8 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-stone-400 hover:text-stone-600 text-sm"
          >
            ← Back
          </button>
          <h1 className="text-xl font-semibold">Log Matcha</h1>
        </div>

        {/* Natural language input */}
        <div className="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <p className="text-xs text-stone-400 uppercase tracking-wide">Type it</p>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='e.g. "3g of Ippodo just now"'
            className="w-full bg-stone-100 dark:bg-stone-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-400"
            onKeyDown={(e) => e.key === 'Enter' && handleParseAndLog()}
          />
          <button
            onClick={handleParseAndLog}
            disabled={!text.trim() || parsing || saving}
            className="bg-green-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {parsing ? 'Parsing...' : 'Log with AI'}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
          <span className="text-xs text-stone-400">or pick manually</span>
          <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
        </div>

        {/* Matcha selector */}
        <div className="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <p className="text-xs text-stone-400 uppercase tracking-wide">Which matcha?</p>
          <div className="flex flex-col gap-2">
            {collection.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-colors text-left ${
                  selectedId === m.id
                    ? 'border-green-500 bg-green-50 dark:bg-green-950'
                    : 'border-transparent bg-stone-50 dark:bg-stone-700'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full border-2 ${
                    selectedId === m.id ? 'border-green-500 bg-green-500' : 'border-stone-300'
                  }`}
                />
                <div>
                  <p className="text-sm font-medium">{m.name}</p>
                  {m.brand && <p className="text-xs text-stone-400">{m.brand}</p>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Gram selector */}
        <div className="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <p className="text-xs text-stone-400 uppercase tracking-wide">Grams</p>
          <div className="flex gap-2">
            {GRAM_PRESETS.map((g) => (
              <button
                key={g}
                onClick={() => { setGrams(g); setUseCustom(false) }}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors ${
                  !useCustom && grams === g
                    ? 'bg-green-500 text-white'
                    : 'bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                }`}
              >
                {g}g
              </button>
            ))}
            <button
              onClick={() => setUseCustom(true)}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors ${
                useCustom
                  ? 'bg-green-500 text-white'
                  : 'bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
              }`}
            >
              Other
            </button>
          </div>
          {useCustom && (
            <input
              type="number"
              value={customGrams}
              onChange={(e) => setCustomGrams(e.target.value)}
              placeholder="e.g. 2.5"
              step="0.5"
              min="0.5"
              autoFocus
              className="bg-stone-100 dark:bg-stone-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-400"
            />
          )}
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        {/* Confirm */}
        <button
          onClick={handleConfirm}
          disabled={saving || !selectedId}
          className="bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white font-semibold py-4 rounded-2xl transition-colors shadow-sm"
        >
          {saving ? 'Saving...' : 'Confirm'}
        </button>
      </div>
    </main>
  )
}
