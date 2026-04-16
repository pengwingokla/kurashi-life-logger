'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MatchaCollection } from '@/lib/supabase'

export default function SettingsPage() {
  const router = useRouter()
  const [collection, setCollection] = useState<MatchaCollection[]>([])
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [grade, setGrade] = useState<string>('ceremonial')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/collection').then((r) => r.json()).then(setCollection)
  }, [])

  async function handleAdd() {
    if (!name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), brand: brand.trim() || null, grade }),
      })
      if (!res.ok) throw new Error()
      const added = await res.json()
      setCollection((prev) => [...prev, added])
      setName(''); setBrand(''); setGrade('ceremonial')
    } catch {
      setError('Failed to add matcha.')
    } finally {
      setSaving(false)
    }
  }

  const shortcutUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/shortcut`
    : '/api/shortcut'

  return (
    <main className="min-h-screen bg-white text-black font-[var(--font-caveat)]">
      <div className="max-w-md mx-auto px-4 py-8 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="border-2 border-black rounded-full px-3 py-1 text-sm hover:bg-black hover:text-white transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        {/* iOS Shortcut */}
        <div className="border-2 border-black rounded-2xl p-4 shadow-[4px_4px_0px_#000] flex flex-col gap-3">
          <p className="text-xs uppercase tracking-widest text-gray-400">iOS Shortcut</p>
          <p className="text-base text-gray-600">Log matcha in one tap from your home screen.</p>
          <ol className="text-sm text-gray-600 list-decimal list-inside flex flex-col gap-1">
            <li>Open the Shortcuts app on iPhone</li>
            <li>Tap <strong>+</strong> → Add Action → <strong>Get Contents of URL</strong></li>
            <li>Set Method to <strong>POST</strong>, Body: <strong>JSON</strong></li>
            <li>Add field: <code>text</code> → your input</li>
            <li>Paste your webhook URL below</li>
          </ol>
          <div className="border-2 border-black rounded-xl px-4 py-3 bg-gray-50 text-sm font-mono break-all shadow-[2px_2px_0px_#000]">
            {shortcutUrl}
          </div>
        </div>

        {/* My Matchas */}
        <div className="border-2 border-black rounded-2xl p-4 shadow-[4px_4px_0px_#000] flex flex-col gap-3">
          <p className="text-xs uppercase tracking-widest text-gray-400">My Matchas</p>
          <div className="flex flex-col gap-2">
            {collection.map((m) => (
              <div
                key={m.id}
                className="flex justify-between items-center border-2 border-black rounded-xl px-4 py-3 shadow-[2px_2px_0px_#000]"
              >
                <div>
                  <p className="text-lg font-semibold">{m.name}</p>
                  {m.brand && <p className="text-sm text-gray-400">{m.brand}</p>}
                </div>
                <span className="text-sm text-gray-400 capitalize border border-gray-300 rounded-full px-2 py-0.5">{m.grade}</span>
              </div>
            ))}
          </div>

          {/* Add form */}
          <div className="flex flex-col gap-2 pt-3 border-t-2 border-black">
            <p className="text-xs uppercase tracking-widest text-gray-400">Add matcha</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name (required)"
              className="border-2 border-black rounded-xl px-4 py-3 text-lg outline-none focus:shadow-[2px_2px_0px_#000] transition-shadow placeholder:text-gray-300"
            />
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Brand (optional)"
              className="border-2 border-black rounded-xl px-4 py-3 text-lg outline-none focus:shadow-[2px_2px_0px_#000] transition-shadow placeholder:text-gray-300"
            />
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="border-2 border-black rounded-xl px-4 py-3 text-lg outline-none bg-white"
            >
              <option value="ceremonial">Ceremonial</option>
              <option value="premium">Premium</option>
              <option value="culinary">Culinary</option>
              <option value="other">Other</option>
            </select>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleAdd}
              disabled={saving}
              className="bg-black text-white font-bold text-lg py-3 rounded-full border-2 border-black shadow-[3px_3px_0px_#666] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 disabled:opacity-40 transition-all"
            >
              {saving ? 'Adding...' : 'Add Matcha →'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
