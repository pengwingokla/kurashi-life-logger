import Link from 'next/link'

export default async function HomePage() {
  const dateLabel = new Date().toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <main className="min-h-screen text-[#1a1008] font-[var(--font-jetbrains)]">
      <div className="max-w-md mx-auto px-4 py-10 flex flex-col gap-6">

        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1 uppercase tracking-widest">{dateLabel}</p>
        </div>

        {/* Module grid */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/matcha" className="block group">
            <div className="washi-card aspect-square p-5 flex flex-col justify-between transition-all group-hover:shadow-[6px_6px_0px_#1a1008] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5">
              <p className="text-2xl font-bold">Matcha</p>
              <span className="text-xl font-bold self-end">→</span>
            </div>
          </Link>
        </div>

      </div>
    </main>
  )
}
