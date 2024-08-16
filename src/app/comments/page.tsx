'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import io, { Socket } from 'socket.io-client'
import { FaEdit, FaHeart, FaRegHeart, FaReply, FaTrash } from 'react-icons/fa'

interface Comment {
  id?: string
  nickname: string
  text: string
  createdAt?: string
  parentId?: string
  likes: number
  edited?: boolean
}

let socket: Socket

export default function Comments() {
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState<Comment[]>([])
  const [replyId, setReplyId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const nickname = searchParams.get('nickname')
  const [showFullText, setShowFullText] = useState(false);

  useEffect(() => {
    const initSocket = async () => {
      socket = io({
        path: '/api/socket',
      })

      socket.on('newComment', (newComment: Comment) => {
        setComments((prevComments) => [newComment, ...prevComments])
      })

      socket.on('updateComment', (updatedComment: Comment) => {
        setComments((prevComments) =>
          prevComments.map((c) =>
            c.id === updatedComment.id ? updatedComment : c
          )
        )
      })

      socket.on('deleteComment', ({ commentId }) => {
        console.log('Evento deleteComment capturado')
        console.log('Comment ID to delete:', commentId)
        setComments((prevComments) =>
          prevComments.filter((c) => c.id !== commentId)
        )
      })

      socket.on('likeComment', ({ commentId, likes }) => {
        setComments((prevComments) =>
          prevComments.map((c) =>
            c.id === commentId ? { ...c, likes } : c
          )
        )
      })
    }

    initSocket()

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [])

  const fetchComments = async (page: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/comments?page=${page}&limit=10`)
      const data = await res.json()
      setTotalPages(data.totalPages)

      if (page === 1) {
        setComments(data.comments)
      } else {
        setComments((prevComments) => [
          ...prevComments,
          ...data.comments.filter((c: Comment) => !prevComments.some((pc) => pc.id === c.id)),
        ])
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComments(page)
  }, [page])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (comment.trim() === '' && replyText.trim() === '') {
      return
    }

    const newComment: Comment = {
      nickname: nickname as string,
      text: replyId ? replyText : comment,
      parentId: replyId || undefined,
      likes: 0,
      edited: false, // Marca o comentário como não editado inicialmente
    }

    socket.emit('comment', newComment)
    setComment('')
    setReplyText('')
    setReplyId(null)
  }

  const handleReplyClick = (id: string) => {
    setReplyId(id)
  }

  const handleLike = (commentId: string) => {
    socket.emit('likeComment', { commentId })
  }

  const handleEdit = (commentId: string, text: string) => {
    setEditId(commentId)
    setEditText(text)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editId && editText.trim() !== '') {
      socket.emit('updateComment', { id: editId, text: editText, edited: true }) // Marca o comentário como editado
      setEditId(null)
      setEditText('')
    }
  }

  const handleDelete = (commentId: string) => {
    console.log('Emitindo deleteComment com ID:', commentId)
    socket.emit('deleteComment', { commentId })
  }

  const getReplies = (parentId: string) => {
    return comments.filter((comment) => comment.parentId === parentId)
  }

  const renderComment = (comment: Comment) => {
    const isLongText = comment.text.split('\n').length > 3;

    return (
      <div key={comment.id} className="bg-white border-l border-[#F3F5F6] p-4">
        <p className="font-bold">
          {comment.nickname} {comment.edited && <span>(Editado)</span>}
        </p>
        {editId === comment.id ? (
          <form onSubmit={(e) => handleEditSubmit(e)}>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-2 border rounded mb-2"
              required
            />
            <button
              type="submit"
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 mr-2"
            >
              Save
            </button>
            <button
              onClick={() => setEditId(null)}
              className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </form>
        ) : (
          <>
            <div>
              <p className={`whitespace-pre-wrap ${!showFullText && 'line-clamp-3'}`}>
                {comment.text}
              </p>
              {isLongText && (
                <button
                  onClick={() => setShowFullText(!showFullText)}
                  className="text-blue-500 hover:underline"
                >
                  {showFullText ? 'Ver menos' : 'Ver mais'}
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {new Date(comment.createdAt!).toLocaleString()}
            </p>
            <div className='flex justify-end'>
              <button
                onClick={() => handleLike(comment.id!)}
                className="flex items-center space-x-1 text-pink-500 hover:text-pink-600 p-2 rounded-md transition-colors duration-200"
              >
                {comment.likes > 0 ? (
                  <FaHeart className="w-5 h-5" />
                ) : (
                  <FaRegHeart className="w-5 h-5" />
                )}
                <span>{comment.likes > 0 ? 'Descurtir' : 'Curtir'} ({comment.likes})</span>
              </button>
              <button
                onClick={() => handleReplyClick(comment.id!)}
                className="flex items-center text-blue-500 hover:text-blue-600 p-2 rounded-md transition-colors duration-200 mr-2"
              >
                <FaReply className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleEdit(comment.id!, comment.text)}
                className="flex items-center text-blue-500 hover:text-blue-600 p-2 rounded-md transition-colors duration-200 mr-2"
              >
                <FaEdit className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDelete(comment.id!)}
                className="flex items-center text-red-500 hover:text-red-600 p-2 rounded-md transition-colors duration-200"
              >
                <FaTrash className="w-5 h-5" />
              </button>
            </div>
          </>
        )}
        {replyId === comment.id && (
          <form onSubmit={handleSubmit} className="mt-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full p-2 border rounded mb-2"
              placeholder="Write a reply..."
              required
            />
            <button
              type="submit"
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Post Reply
            </button>
          </form>
        )}
        <div className="ml-5 mt-2 space-y-2">
          {getReplies(comment.id!).map((reply) => renderComment(reply))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-4">Comments</h1>
      <div className="bg-white p-4 mb-4">
        <form onSubmit={handleSubmit}>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-2 border rounded mb-2"
            placeholder="Write a comment..."
            required
          />
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Post Comment
          </button>
        </form>
      </div>
      <div className="space-y-4">
        {comments.length > 0 &&
          comments.filter((comment) => !comment.parentId).map((comment) => renderComment(comment))}
      </div>
      {page < totalPages && (
        <button
          onClick={() => setPage((prevPage) => prevPage + 1)}
          className="mt-4 bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Carregando...' : 'Ver Mais'}
        </button>
      )}
    </div>
  )
}
