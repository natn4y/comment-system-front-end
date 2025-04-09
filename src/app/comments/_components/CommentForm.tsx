import { useState } from 'react'

interface CommentFormProps {
  onSubmit: (comment: { nickname: string; text: string; parentId?: string; likes: number }) => any
  nickname: string
  parentId?: string
}

export default function CommentForm({ onSubmit, nickname, parentId }: CommentFormProps) {
  const [text, setText] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim()) {
      onSubmit({ nickname, text, parentId, likes: 0 })
      setText('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
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
  )
}