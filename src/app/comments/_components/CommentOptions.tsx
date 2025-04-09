import { useState, useRef, useEffect } from 'react'
import { FaEdit, FaHeart, FaRegHeart, FaReply, FaTrash } from 'react-icons/fa'

interface CommentOptionsProps {
  onLike: () => void
  onReply: () => void
  onEdit: () => void
  onDelete: () => void
  likes: number
}

export default function CommentOptions({ onLike, onReply, onEdit, onDelete, likes }: CommentOptionsProps) {
  const [showOptions, setShowOptions] = useState(false)
  const optionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleOptionClick = (action: () => void) => {
    action()
    setShowOptions(false)
  }

  return (
    <div className="relative flex justify-end items-center md:opacity-0 group-hover:opacity-100 md:mx-4 transition-opacity duration-200">
      <div className="md:hidden">
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="text-[#66829F] rounded-md transition-colors duration-200"
        >
          Opções
        </button>
      </div>

      <div
        ref={optionsRef}
        className={`z-[999] w-[200px] absolute right-0 top-full ${showOptions ? 'flex' : 'hidden'
          } flex-col mt-2 bg-white shadow-md rounded-md p-2 md:flex md:flex-row md:relative md:bg-transparent md:shadow-none md:mt-0`}
      >
        <button
          onClick={() => handleOptionClick(onLike)}
          className="flex items-center justify-between space-x-1 text-[#66829F] hover:brightness-110 p-2 rounded-md transition-colors duration-200"
        >
          {likes > 0 ? (
            <FaHeart className="text-[red] hover:brightness-105 w-5 h-5" />
          ) : (
            <FaRegHeart className="text-[red] hover:brightness-105 w-5 h-5" />
          )}
          <span className="hidden md:block">
            {likes > 0 ? '' : ''} ({likes})
          </span>
          <p className='text-black md:hidden'>Curtir</p>
        </button>
        <button
          onClick={() => handleOptionClick(onReply)}
          className="flex items-center justify-between text-blue-500 hover:text-blue-600 p-2 rounded-md transition-colors duration-200"
        >
          <FaReply className="w-5 h-5" />
          <p className='text-black md:hidden'>Responder</p>
        </button>
        <button
          onClick={() => handleOptionClick(onEdit)}
          className="flex items-center justify-between text-blue-500 hover:text-blue-600 p-2 rounded-md transition-colors duration-200"
        >
          <FaEdit className="w-5 h-5" />
          <p className='text-black md:hidden'>Editar</p>
        </button>
        <button
          onClick={() => handleOptionClick(onDelete)}
          className="flex items-center justify-between text-red-500 hover:text-red-600 p-2 rounded-md transition-colors duration-200"
        >
          <FaTrash className="w-5 h-5" />
          <p className='text-black md:hidden'>Apagar</p>
        </button>
      </div>
    </div>
  )
}