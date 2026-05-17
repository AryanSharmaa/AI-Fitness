import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const routines = await prisma.customRoutine.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json({ routines })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, type, exercises, notes } = body

  if (!name || !type || !exercises) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const routine = await prisma.customRoutine.create({
    data: {
      userId: session.user.id,
      name,
      type,
      exercises,
      notes: notes || null,
    },
  })

  return NextResponse.json({ routine }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const routine = await prisma.customRoutine.findUnique({ where: { id } })
  if (!routine || routine.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.customRoutine.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
