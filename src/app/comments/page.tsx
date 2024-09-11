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
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showFullText, setShowFullText] = useState(false);
  const [openCommentId, setOpenCommentId] = useState(null);
  const searchParams = useSearchParams();
  const nickname = searchParams.get('nickname');

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
      edited: false,
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
      socket.emit('updateComment', { id: editId, text: editText, edited: true })
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

  const toggleOptions = (id: any) => {
    if (openCommentId === id) {
      setOpenCommentId(null);
    } else {
      setOpenCommentId(id);
    }
  };

  const renderComment = (comment: Comment) => {
    const isLongText = comment.text.split('\n').length > 3;

    return (
      <div key={comment.id} className="group border-l bg-[#354A5F] border-[#66829F] p-4">
        <div className='flex flex-wrap items-center justify-between md:justify-start gap-4'>
          <p className="mb-[0.10rem] font-semibold text-[#66829F]">
            {comment.nickname} {comment.edited && <span>(Editado)</span>}
          </p>
          <div className="relative flex justify-end items-center md:opacity-0 group-hover:opacity-100 md:mx-4 transition-opacity duration-200">
            <div className="md:hidden">
              <button
                onClick={() => toggleOptions(comment.id)}
                className="text-[#66829F] rounded-md transition-colors duration-200"
              >
                Opções
              </button>
            </div>

            <div
              className={`z-[999] w-[200px] absolute right-0 top-full ${openCommentId === comment.id ? 'flex' : 'hidden'
                } flex-col mt-2 bg-white shadow-md rounded-md p-2 md:flex md:flex-row md:relative md:bg-transparent md:shadow-none md:mt-0`}
            >
              <button
                onClick={() => handleLike(comment.id!)}
                className="flex items-center justify-between space-x-1 text-[#66829F] hover:brightness-110 p-2 rounded-md transition-colors duration-200"
              >
                {comment.likes > 0 ? (
                  <>
                    <FaHeart className="text-[red] hover:brightness-105 w-5 h-5" />
                  </>
                ) : (
                  <FaRegHeart className="text-[red] hover:brightness-105 w-5 h-5" />
                )}
                <span className="hidden md:block">
                  {comment.likes > 0 ? '' : ''} ({comment.likes})
                </span>
                <p className='text-black md:hidden'>Curtir</p>

              </button>
              <button
                onClick={() => handleReplyClick(comment.id!)}
                className="flex items-center justify-between text-blue-500 hover:text-blue-600 p-2 rounded-md transition-colors duration-200"
              >
                <FaReply className="w-5 h-5" />
                <p className='text-black md:hidden'>Responder</p>

              </button>

              <button
                onClick={() => handleEdit(comment.id!, comment.text)}
                className="flex items-center justify-between text-blue-500 hover:text-blue-600 p-2 rounded-md transition-colors duration-200"
              >
                <FaEdit className="w-5 h-5" />
                <p className='text-black md:hidden'>Editar</p>

              </button>
              <button
                onClick={() => handleDelete(comment.id!)}
                className="flex items-center justify-between text-red-500 hover:text-red-600 p-2 rounded-md transition-colors duration-200"
              >
                <FaTrash className="w-5 h-5" />
                <p className='text-black md:hidden'>Apagar</p>
              </button>
            </div>
          </div>

        </div>

        {editId === comment.id ? (
          <form onSubmit={(e) => handleEditSubmit(e)}>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="bg-[#2B3D4F] text-white placeholder:text-[#66829F] w-full p-2 border border-[#66829F] outline-none rounded mb-2"
              required
            />
            <button
              type="submit"
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 mr-2"
            >
              Salvar
            </button>
            <button
              onClick={() => setEditId(null)}
              className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
            >
              Cancelar
            </button>
          </form>
        ) : (
          <>
            <div>
              <p className={`whitespace-pre-wrap text-white ${!showFullText && 'line-clamp-3'}`}>
                {comment.text}
              </p>
              {isLongText && (
                <button
                  onClick={() => setShowFullText(!showFullText)}
                  className="text-[#66829F] hover:underline"
                >
                  {showFullText ? 'Ver menos' : 'Ver mais'}
                </button>
              )}
            </div>


          </>
        )}
        {replyId === comment.id && (
          <form onSubmit={handleSubmit} className="mt-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="bg-[#2B3D4F] text-white placeholder:text-[#66829F] w-full p-2 border border-[#66829F] outline-none rounded mb-2"
              placeholder="Comment..."
              required
            />
            <button
              type="submit"
              className="mb-2 bg-transparent border text-sm border-[#66829F] text-white p-2 rounded hover:brightness-105 hover:bg-[#354A5F] mr-2"
            >
              Enviar Resposta
            </button>
            <button
              onClick={() => setReplyId(null)}
              className="mb-2 bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
            >
              Cancelar
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
    <div className="min-h-screen bg-[#2B3D4F] text-white p-8">
      <div className='mb-8'>
        <p>Olá, <span className='text-[#66829F]'>{nickname}</span></p>
      </div>
      <div className="bg-[#2B3D4F] mb-4">
        <form onSubmit={handleSubmit}>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="bg-[#2B3D4F] text-white placeholder:text-[#66829F] w-full p-2 border border-[#66829F] outline-none rounded mb-2"
            placeholder="Escreva aqui seu comentário"
            required
            rows={3}
          />
          <button
            type="submit"
            className="bg-transparent border text-sm border-[#66829F] text-white p-2 rounded hover:brightness-105 hover:bg-[#354A5F] mr-2"
          >
            Enviar Comentário
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