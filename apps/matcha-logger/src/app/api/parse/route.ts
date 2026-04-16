import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const { text } = await request.json()
  if (!text) return NextResponse.json({ error: 'text is required' }, { status: 400 })

  // Fetch collection so Claude can match matcha names
  const { data: collection } = await supabase
    .from('matcha_collection')
    .select('id, name, brand')

  const collectionList = collection
    ?.map((m) => `- ${m.name}${m.brand ? ` (${m.brand})` : ''} [id: ${m.id}]`)
    .join('\n') ?? 'No matchas in collection'

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: `You are a matcha log parser. Extract matcha details from the user's input.

User's matcha collection:
${collectionList}

User input: "${text}"

Respond with JSON only, no explanation:
{
  "matcha_id": "<id from collection if matched, otherwise null>",
  "matcha_name": "<matched name or best guess>",
  "grams": <number>,
  "logged_at": "<ISO 8601 datetime, use current time if not specified: ${new Date().toISOString()}>",
  "notes": "<any other details, or null>"
}`,
      },
    ],
  })

  const raw = (message.content[0] as { type: string; text: string }).text
  try {
    const parsed = JSON.parse(raw)

    // Auto-log after parsing
    const { data: log, error } = await supabase
      .from('matcha_logs')
      .insert({
        matcha_id: parsed.matcha_id ?? null,
        grams: parsed.grams,
        notes: parsed.notes ?? null,
        logged_at: parsed.logged_at ?? new Date().toISOString(),
      })
      .select('*, matcha_collection(name)')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      message: `Logged ${log.grams}g of ${log.matcha_collection?.name ?? parsed.matcha_name ?? 'matcha'}`,
      log,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response', raw }, { status: 500 })
  }
}
