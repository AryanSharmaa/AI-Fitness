import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'

// Vision-capable models in priority order
const VISION_MODELS = [
  'google/gemini-2.0-flash-exp:free',
  'google/gemini-flash-1.5:free',
  'meta-llama/llama-3.2-11b-vision-instruct:free',
  'openai/gpt-4o-mini',
]

let _client: OpenAI | null = null
function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY || '',
    })
  }
  return _client
}

const SYSTEM = `You are a nutrition expert specialising in Indian food. When given a food image, identify what's in it and estimate macros for a typical Indian serving size.

Always respond with ONLY this JSON (no markdown, no explanation):
{
  "description": "brief description of the meal",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "confidence": "low|medium|high"
}`

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  const formData = await req.formData()
  const file = formData.get('image') as File | null
  const mealType = (formData.get('mealType') as string) || 'lunch'

  if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 })
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Image too large (max 5MB)' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const mimeType = file.type || 'image/jpeg'

  let parsed: { description: string; calories: number; protein: number; carbs: number; fat: number; confidence: string } | null = null
  let lastErr: any

  for (const model of VISION_MODELS) {
    try {
      const res = await getClient().chat.completions.create({
        model,
        max_tokens: 256,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: SYSTEM },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
          ],
        }],
      })
      const raw = res.choices[0]?.message?.content ?? ''
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (jsonMatch) { parsed = JSON.parse(jsonMatch[0]); break }
    } catch (err: any) {
      const status = err?.status ?? err?.response?.status
      if (status === 429 || status === 404 || status === 503) { lastErr = err; continue }
      throw err
    }
  }

  if (!parsed) {
    return NextResponse.json({ error: 'Could not analyse the image. Try describing the meal instead.' }, { status: 422 })
  }

  const log = await prisma.foodLog.create({
    data: {
      userId,
      meal: parsed.description.slice(0, 100),
      description: parsed.description,
      mealType,
      inputMethod: 'photo',
      calories: Math.round(parsed.calories),
      protein: Math.round(parsed.protein * 10) / 10,
      carbs: Math.round(parsed.carbs * 10) / 10,
      fat: Math.round(parsed.fat * 10) / 10,
    },
  })

  return NextResponse.json({ log, confidence: parsed.confidence })
}
