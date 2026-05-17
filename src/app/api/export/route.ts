import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  // If value contains comma, double-quote, or newline, wrap in quotes and escape inner quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

function buildCSV(headers: string[], rows: unknown[][]): string {
  const headerLine = headers.map(escapeCSVValue).join(',')
  const dataLines = rows.map(row => row.map(escapeCSVValue).join(','))
  return [headerLine, ...dataLines].join('\r\n')
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')

  if (!type || !['food', 'workout', 'body', 'mood'].includes(type)) {
    return NextResponse.json(
      { error: 'Invalid type. Must be one of: food, workout, body, mood' },
      { status: 400 }
    )
  }

  let csv = ''
  let filename = ''

  if (type === 'food') {
    const logs = await prisma.foodLog.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    })

    const headers = ['date', 'mealType', 'description', 'calories', 'protein', 'carbs', 'fat']
    const rows = logs.map(log => [
      formatDate(log.date),
      log.mealType,
      log.description,
      log.calories,
      log.protein,
      log.carbs,
      log.fat,
    ])

    csv = buildCSV(headers, rows)
    filename = 'fitmind_food_export.csv'
  } else if (type === 'workout') {
    const logs = await prisma.workoutLog.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    })

    const headers = ['date', 'type', 'duration', 'caloriesBurned', 'steps', 'distance', 'notes']
    const rows = logs.map(log => [
      formatDate(log.date),
      log.type,
      log.duration,
      log.caloriesBurned,
      log.steps,
      log.distance,
      log.notes,
    ])

    csv = buildCSV(headers, rows)
    filename = 'fitmind_workout_export.csv'
  } else if (type === 'body') {
    const logs = await prisma.bodyLog.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    })

    const headers = ['date', 'weight', 'waist', 'chest', 'arms', 'hips', 'notes']
    const rows = logs.map(log => [
      formatDate(log.date),
      log.weight,
      log.waist,
      log.chest,
      log.arms,
      log.hips,
      log.notes,
    ])

    csv = buildCSV(headers, rows)
    filename = 'fitmind_body_export.csv'
  } else if (type === 'mood') {
    const logs = await prisma.moodLog.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    })

    const headers = ['date', 'mood', 'energy', 'notes']
    const rows = logs.map(log => [
      formatDate(log.date),
      log.mood,
      log.energy,
      log.notes,
    ])

    csv = buildCSV(headers, rows)
    filename = 'fitmind_mood_export.csv'
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
