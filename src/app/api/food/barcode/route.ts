import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface OFFProduct {
  product_name?: string
  nutriments?: {
    'energy-kcal_100g'?: number
    'energy-kcal_serving'?: number
    proteins_100g?: number
    proteins_serving?: number
    carbohydrates_100g?: number
    carbohydrates_serving?: number
    fat_100g?: number
    fat_serving?: number
  }
  serving_size?: string
  serving_quantity?: number
  brands?: string
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const barcode = new URL(req.url).searchParams.get('code')
  if (!barcode) return NextResponse.json({ error: 'code required' }, { status: 400 })

  const res = await fetch(
    `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
    { next: { revalidate: 86400 } }
  )
  const json = await res.json()

  if (json.status !== 1 || !json.product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const p: OFFProduct = json.product
  const n = p.nutriments || {}

  // Prefer per-serving if available, else per-100g (assume ~100g serving)
  const calories = Math.round(n['energy-kcal_serving'] || n['energy-kcal_100g'] || 0)
  const protein = Math.round((n.proteins_serving ?? n.proteins_100g ?? 0) * 10) / 10
  const carbs = Math.round((n.carbohydrates_serving ?? n.carbohydrates_100g ?? 0) * 10) / 10
  const fat = Math.round((n.fat_serving ?? n.fat_100g ?? 0) * 10) / 10
  const name = p.product_name || 'Unknown product'
  const brand = p.brands || ''
  const serving = p.serving_size || '100g'

  return NextResponse.json({ name, brand, serving, calories, protein, carbs, fat })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  const { name, brand, calories, protein, carbs, fat, mealType, serving } = await req.json()

  const log = await prisma.foodLog.create({
    data: {
      userId,
      meal: `${name}${brand ? ` (${brand})` : ''}`.slice(0, 100),
      description: `${name}${brand ? ` — ${brand}` : ''}${serving ? `, ${serving}` : ''}`,
      mealType: mealType || 'snack',
      inputMethod: 'barcode',
      calories: Math.round(calories),
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10,
    },
  })

  return NextResponse.json({ log })
}
