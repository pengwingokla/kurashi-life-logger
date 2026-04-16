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
      if (!res.ok) throw new Error()
      router.push('/matcha')
      router.refresh()
    } catch {
      setError('Failed to parse. Try the quick-select below.')
    } finally {
      setParsing(false)
    }
  }

  async function handleConfirm() {
    const finalGrams = useCustom ? parseFloat(customGrams) : grams
    if (!finalGrams || finalGrams <= 0) { setError('Enter a valid gram amount'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matcha_id: selectedId, grams: finalGrams }),
      })
      if (!res.ok) throw new Error()
      router.push('/matcha')
      router.refresh()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen text-[#1a1008] font-[var(--font-jetbrains)]">
      <div className="max-w-md mx-auto px-4 py-8 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="border-2 border-black rounded-full px-3 py-1 text-sm hover:bg-black hover:text-white transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold">Log Matcha</h1>
        </div>

        {/* AI input */}
        <div className="washi-card p-4 flex flex-col gap-3">
          <p className="text-xs uppercase tracking-widest text-gray-400">Type it</p>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='e.g. "3g of Ippodo just now"'
            className="w-full border-2 border-black rounded-xl px-4 py-3 text-lg outline-none focus:shadow-[2px_2px_0px_#000] transition-shadow placeholder:text-gray-300"
            onKeyDown={(e) => e.key === 'Enter' && handleParseAndLog()}
          />
          <button
            onClick={handleParseAndLog}
            disabled={!text.trim() || parsing || saving}
            className="bg-black text-white font-bold text-lg py-3 rounded-full border-2 border-black shadow-[3px_3px_0px_#666] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 disabled:opacity-40 transition-all"
          >
            {parsing ? 'Parsing...' : 'Log with AI →'}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-0.5 bg-black" />
          <span className="text-sm text-gray-400">or pick manually</span>
          <div className="flex-1 h-0.5 bg-black" />
        </div>

        {/* Matcha selector */}
        <div className="washi-card p-4 flex flex-col gap-3">
          <p className="text-xs uppercase tracking-widest text-gray-400">Which matcha?</p>
          <div className="flex flex-col gap-2">
            {collection.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                  selectedId === m.id
                    ? 'border-black bg-black text-white shadow-none'
                    : 'border-black shadow-[2px_2px_0px_#1a1008] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5'
                }`}
              >
                <div>
                  <p className="text-lg font-semibold">{m.name}</p>
                  {m.brand && <p className={`text-sm ${selectedId === m.id ? 'text-gray-300' : 'text-gray-400'}`}>{m.brand}</p>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Gram selector */}
        <div className="washi-card p-4 flex flex-col gap-3">
          <p className="text-xs uppercase tracking-widest text-gray-400">Grams</p>
          <div className="flex gap-2">
            {GRAM_PRESETS.map((g) => (
              <button
                key={g}
                onClick={() => { setGrams(g); setUseCustom(false) }}
                className={`flex-1 py-3 rounded-full border-2 border-black font-bold text-lg transition-all ${
                  !useCustom && grams === g
                    ? 'bg-black text-white shadow-none'
                    : 'shadow-[2px_2px_0px_#1a1008] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5'
                }`}
              >
                {g}g
              </button>
            ))}
            <button
              onClick={() => setUseCustom(true)}
              className={`flex-1 py-3 rounded-full border-2 border-black font-bold text-lg transition-all ${
                useCustom
                  ? 'bg-black text-white shadow-none'
                  : 'shadow-[2px_2px_0px_#1a1008] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5'
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
              className="border-2 border-black rounded-xl px-4 py-3 text-lg outline-none focus:shadow-[2px_2px_0px_#000]"
            />
          )}
        </div>

        {error && <p className="text-red-500 text-center">{error}</p>}

        {/* Confirm */}
        <button
          onClick={handleConfirm}
          disabled={saving || !selectedId}
          className="bg-black text-white font-bold text-xl py-4 rounded-full border-2 border-black shadow-[4px_4px_0px_#666] hover:shadow-none hover:translate-x-1 hover:translate-y-1 disabled:opacity-40 transition-all"
        >
          {saving ? 'Saving...' : 'Confirm →'}
        </button>
      </div>
    </main>
  )
}
