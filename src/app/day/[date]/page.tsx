import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { MatchaLog } from '@/lib/supabase'
import { formatTimeET, formatDateLabel } from '@/lib/time'
import LogActions from './LogActions'

export default async function DayPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params

  const from = new Date(`${date}T00:00:00-05:00`)
  const to = new Date(`${date}T23:59:59-05:00`)

  const { data: collectionData } = await supabase
    .from('matcha_collection')
    .select('id, name, brand, grade')

  const { data } = await supabase
    .from('matcha_logs')
    .select('*, matcha_collection(id, name, brand, grade)')
    .gte('logged_at', from.toISOString())
    .lte('logged_at', to.toISOString())
    .order('logged_at', { ascending: true })

  const logs = (data as MatchaLog[]) ?? []
  const collection = collectionData ?? []
  const totalGrams = logs.reduce((sum, l) => sum + l.grams, 0)

  return (
    <main className="min-h-screen text-[#1a1008] font-[var(--font-jetbrains)]">
      <div className="max-w-md mx-auto px-4 py-8 flex flex-col gap-6">

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="border-2 border-black rounded-full px-3 py-1 text-sm hover:bg-black hover:text-white transition-colors"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold">{formatDateLabel(date)}</h1>
        </div>

        {logs.length === 0 ? (
          <div className="border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0px_#000] text-center">
            <p className="text-gray-400 text-lg">No matcha logged this day.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="washi-card p-4">
                <p className="text-xs uppercase tracking-widest text-gray-400">Cups</p>
                <p className="text-4xl font-bold mt-1">{logs.length}</p>
              </div>
              <div className="washi-card p-4">
                <p className="text-xs uppercase tracking-widest text-gray-400">Total</p>
                <p className="text-4xl font-bold mt-1">{totalGrams}g</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="washi-card px-4 py-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-lg font-semibold">
                        {log.matcha_collection?.name ?? 'Unknown matcha'}
                      </p>
                      {log.matcha_collection?.brand && (
                        <p className="text-sm text-gray-400">{log.matcha_collection.brand}</p>
                      )}
                      {log.notes && (
                        <p className="text-sm text-gray-400 italic mt-0.5">{log.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{log.grams}g</p>
                      <p className="text-sm text-gray-400">{formatTimeET(log.logged_at)}</p>
                    </div>
                  </div>
                  <LogActions log={log} collection={collection} date={date} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
