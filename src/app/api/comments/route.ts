import prisma from '@/app/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const limit = parseInt(url.searchParams.get('limit') || '5', 10)
    const skip = (page - 1) * limit

    const comments = await prisma.comment.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    })

    const totalComments = await prisma.comment.count()

    return NextResponse.json({
      comments,
      totalComments,
      totalPages: Math.ceil(totalComments / limit),
    })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Error fetching comments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nickname, text, parentId } = body

    const comment = await prisma.comment.create({
      data: {
        nickname,
        text,
        parentId,
      },
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Error creating comment' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, text } = body

    const comment = await prisma.comment.updateMany({
      where: {
        id,
      },
      data: {
        text,
      },
    })

    if (comment.count === 0) {
      return NextResponse.json({ error: 'Comment not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating comment:', error)
    return NextResponse.json({ error: 'Error updating comment' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const userId = url.searchParams.get('userId')

    if (!id || !userId) {
      return NextResponse.json({ error: 'Missing id or userId' }, { status: 400 })
    }

    const comment = await prisma.comment.deleteMany({
      where: {
        id,
      },
    })

    if (comment.count === 0) {
      return NextResponse.json({ error: 'Comment not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json({ error: 'Error deleting comment' }, { status: 500 })
  }
}