// src/pages/api/comments.ts
import prisma from '@/app/lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req

  switch (method) {
    case 'GET':
      try {
        const page = parseInt(req.query.page as string || '1', 10)
        const limit = parseInt(req.query.limit as string || '5', 10)
        const skip = (page - 1) * limit

        const comments = await prisma.comment.findMany({
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        })

        const totalComments = await prisma.comment.count()

        res.status(200).json({
          comments,
          totalComments,
          totalPages: Math.ceil(totalComments / limit),
        })
      } catch (error) {
        console.error('Error fetching comments:', error)
        res.status(500).json({ error: 'Error fetching comments' })
      }
      break

    case 'POST':
      try {
        const { nickname, text, parentId } = req.body

        const comment = await prisma.comment.create({
          data: {
            nickname,
            text,
            parentId,
          },
        })

        res.status(201).json(comment)
      } catch (error) {
        console.error('Error creating comment:', error)
        res.status(500).json({ error: 'Error creating comment' })
      }
      break

    case 'PUT':
      try {
        const { id, text } = req.body

        const comment = await prisma.comment.updateMany({
          where: {
            id,
          },
          data: {
            text,
          },
        })

        if (comment.count === 0) {
          return res.status(404).json({ error: 'Comment not found or unauthorized' })
        }

        res.status(200).json({ success: true })
      } catch (error) {
        console.error('Error updating comment:', error)
        res.status(500).json({ error: 'Error updating comment' })
      }
      break

    case 'DELETE':
      try {
        const id = req.query.id as string
        const userId = req.query.userId as string

        if (!id || !userId) {
          return res.status(400).json({ error: 'Missing id or userId' })
        }

        const comment = await prisma.comment.deleteMany({
          where: {
            id,
          },
        })

        if (comment.count === 0) {
          return res.status(404).json({ error: 'Comment not found or unauthorized' })
        }

        res.status(200).json({ success: true })
      } catch (error) {
        console.error('Error deleting comment:', error)
        res.status(500).json({ error: 'Error deleting comment' })
      }
      break

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}