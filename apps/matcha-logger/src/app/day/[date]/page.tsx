import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { MatchaLog } from '@/lib/supabase'

export default async function DayPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params

  const from = new Date(`${date}T00:00:00`)
  const to = new Date(`${date}T23:59:59`)

  const { data } = await supabase
    .from('matcha_logs')
    .select('*, matcha_collection(id, name, brand, grade)')
    .gte('logged_at', from.toISOString())
    .lte('logged_at', to.toISOString())
    .order('logged_at', { ascending: true })

  const logs = (data as MatchaLog[]) ?? []
  const totalGrams = logs.reduce((sum, l) => sum + l.grams, 0)

  const label = new Date(`${date}T12:00:00`).toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <main className="min-h-screen bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100">
      <div className="max-w-md mx-auto px-4 py-8 flex flex-col gap-6">

        <div className="flex items-center gap-3">
          <Link href="/" className="text-stone-400 hover:text-stone-600 text-sm">
            ← Back
          </Link>
          <h1 className="text-xl font-semibold">{label}</h1>
        </div>

        {logs.length === 0 ? (
          <div className="bg-white dark:bg-stone-800 rounded-2xl p-6 shadow-sm text-center">
            <p className="text-stone-400 text-sm">No matcha logged this day.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm">
                <p className="text-xs text-stone-400 uppercase tracking-wide">Cups</p>
                <p className="text-2xl font-bold mt-1">{logs.length}</p>
              </div>
              <div className="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm">
                <p className="text-xs text-stone-400 uppercase tracking-wide">Total</p>
                <p className="text-2xl font-bold mt-1">{totalGrams}g</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white dark:bg-stone-800 rounded-xl px-4 py-3 shadow-sm flex justify-between items-center"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {log.matcha_collection?.name ?? 'Unknown matcha'}
                    </p>
                    {log.matcha_collection?.brand && (
                      <p className="text-xs text-stone-400">{log.matcha_collection.brand}</p>
                    )}
                    {log.notes && (
                      <p className="text-xs text-stone-400 mt-0.5 italic">{log.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{log.grams}g</p>
                    <p className="text-xs text-stone-400">
                      {new Date(log.logged_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
