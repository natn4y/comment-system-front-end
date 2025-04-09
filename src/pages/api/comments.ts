// src/pages/api/comments.ts
import prisma from '@/app/lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Add CORS headers for development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method } = req

  // Test database connection first
  try {
    await prisma.$connect();
  } catch (dbError) {
    console.error('Database connection error:', dbError);
    return res.status(500).json({
      error: 'Database connection failed',
      details: process.env.NODE_ENV === 'development' ? String(dbError) : undefined
    });
  }

  switch (method) {
    case 'GET':
      try {
        const page = parseInt(String(req.query.page) || '1', 10);
        const limit = parseInt(String(req.query.limit) || '10', 10);
        const skip = (page - 1) * limit;

        const comments = await prisma.comment.findMany({
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        });

        const totalComments = await prisma.comment.count();

        return res.status(200).json({
          comments,
          totalComments,
          totalPages: Math.ceil(totalComments / limit),
          currentPage: page
        });
      } catch (error) {
        console.error('Error fetching comments:', error);
        return res.status(500).json({ error: 'Error fetching comments' });
      }

    case 'POST':
      try {
        const { nickname, text, parentId } = req.body;

        if (!nickname || !text) {
          return res.status(400).json({ error: 'Nickname and text are required' });
        }

        const comment = await prisma.comment.create({
          data: {
            nickname,
            text,
            parentId: parentId || null,
            likes: 0,
          },
        });

        return res.status(201).json(comment);
      } catch (error) {
        console.error('Error creating comment:', error);
        return res.status(500).json({ error: 'Error creating comment' });
      }

    case 'PUT':
      try {
        const { id, text } = req.body;

        if (!id || !text) {
          return res.status(400).json({ error: 'Comment ID and text are required' });
        }

        const comment = await prisma.comment.updateMany({
          where: {
            id,
          },
          data: {
            text,
            edited: true
          },
        });

        if (comment.count === 0) {
          return res.status(404).json({ error: 'Comment not found or unauthorized' });
        }

        return res.status(200).json({ success: true });
      } catch (error) {
        console.error('Error updating comment:', error);
        return res.status(500).json({ error: 'Error updating comment' });
      }

    case 'DELETE':
      try {
        // Support for both query param and body
        const id = req.query.id as string || req.body.id;

        if (!id) {
          return res.status(400).json({ error: 'Comment ID is required' });
        }

        const comment = await prisma.comment.deleteMany({
          where: {
            id,
          },
        });

        if (comment.count === 0) {
          return res.status(404).json({ error: 'Comment not found or unauthorized' });
        }

        return res.status(200).json({ success: true });
      } catch (error) {
        console.error('Error deleting comment:', error);
        return res.status(500).json({ error: 'Error deleting comment' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
  }
}