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
    fetch('/api/collection')
      .then((r) => r.json())
      .then(setCollection)
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
      setName('')
      setBrand('')
      setGrade('ceremonial')
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
    <main className="min-h-screen bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100">
      <div className="max-w-md mx-auto px-4 py-8 flex flex-col gap-6">

        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-stone-400 hover:text-stone-600 text-sm">
            ← Back
          </button>
          <h1 className="text-xl font-semibold">Settings</h1>
        </div>

        {/* iOS Shortcut */}
        <div className="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <p className="text-xs text-stone-400 uppercase tracking-wide">iOS Shortcut</p>
          <p className="text-sm text-stone-600 dark:text-stone-300">
            Set up a Shortcut to log matcha in one tap from your home screen.
          </p>
          <ol className="text-sm text-stone-600 dark:text-stone-400 list-decimal list-inside flex flex-col gap-1">
            <li>Open the Shortcuts app on iPhone</li>
            <li>Tap <strong>+</strong> → Add Action → <strong>Get Contents of URL</strong></li>
            <li>Set Method to <strong>POST</strong></li>
            <li>Paste your webhook URL below</li>
            <li>Add the Shortcut to your home screen</li>
          </ol>
          <div className="bg-stone-100 dark:bg-stone-700 rounded-xl px-4 py-3 text-xs font-mono break-all">
            {shortcutUrl}
          </div>
        </div>

        {/* My Matchas */}
        <div className="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <p className="text-xs text-stone-400 uppercase tracking-wide">My Matchas</p>
          <div className="flex flex-col gap-2">
            {collection.map((m) => (
              <div
                key={m.id}
                className="flex justify-between items-center px-3 py-2 bg-stone-50 dark:bg-stone-700 rounded-xl"
              >
                <div>
                  <p className="text-sm font-medium">{m.name}</p>
                  {m.brand && <p className="text-xs text-stone-400">{m.brand}</p>}
                </div>
                <span className="text-xs text-stone-400 capitalize">{m.grade}</span>
              </div>
            ))}
          </div>

          {/* Add new */}
          <div className="flex flex-col gap-2 pt-2 border-t border-stone-100 dark:border-stone-700">
            <p className="text-xs text-stone-400">Add matcha</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name (required)"
              className="bg-stone-100 dark:bg-stone-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-400"
            />
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Brand (optional)"
              className="bg-stone-100 dark:bg-stone-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-400"
            />
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="bg-stone-100 dark:bg-stone-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-400"
            >
              <option value="ceremonial">Ceremonial</option>
              <option value="premium">Premium</option>
              <option value="culinary">Culinary</option>
              <option value="other">Other</option>
            </select>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button
              onClick={handleAdd}
              disabled={saving}
              className="bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {saving ? 'Adding...' : 'Add Matcha'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
