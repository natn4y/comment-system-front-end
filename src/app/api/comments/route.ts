// src/app/api/comments/route.ts
import prisma from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

// Helper para configurar CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

// GET handler
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    // Execute ambas as consultas em paralelo para melhorar a performance
    const [comments, totalComments] = await Promise.all([
      prisma.comment.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.comment.count()
    ]);

    return NextResponse.json({
      comments,
      totalComments,
      totalPages: Math.ceil(totalComments / limit),
      currentPage: page
    }, {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Error fetching comments' }, {
      status: 500,
      headers: corsHeaders
    });
  }
}

// POST handler
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nickname, text, parentId } = body;

    if (!nickname || !text) {
      return NextResponse.json({ error: 'Nickname and text are required' }, {
        status: 400,
        headers: corsHeaders
      });
    }

    const comment = await prisma.comment.create({
      data: {
        nickname,
        text,
        parentId: parentId || null,
        likes: 0,
      },
    });

    return NextResponse.json(comment, {
      status: 201,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Error creating comment' }, {
      status: 500,
      headers: corsHeaders
    });
  }
}

// PUT handler
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, text } = body;

    if (!id || !text) {
      return NextResponse.json({ error: 'Comment ID and text are required' }, {
        status: 400,
        headers: corsHeaders
      });
    }

    const comment = await prisma.comment.updateMany({
      where: { id },
      data: {
        text,
        edited: true
      },
    });

    if (comment.count === 0) {
      return NextResponse.json({ error: 'Comment not found or unauthorized' }, {
        status: 404,
        headers: corsHeaders
      });
    }

    return NextResponse.json({ success: true }, {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json({ error: 'Error updating comment' }, {
      status: 500,
      headers: corsHeaders
    });
  }
}

// DELETE handler
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    let id = url.searchParams.get('id');

    // Se não estiver nos parâmetros de consulta, tente obter do corpo
    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch {
        // Ignora erros de parse do JSON
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'Comment ID is required' }, {
        status: 400,
        headers: corsHeaders
      });
    }

    const comment = await prisma.comment.deleteMany({
      where: { id },
    });

    if (comment.count === 0) {
      return NextResponse.json({ error: 'Comment not found or unauthorized' }, {
        status: 404,
        headers: corsHeaders
      });
    }

    return NextResponse.json({ success: true }, {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Error deleting comment' }, {
      status: 500,
      headers: corsHeaders
    });
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders
  });
}