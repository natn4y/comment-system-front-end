import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

interface ReplyFormProps {
  onSubmit: (text: string, nickname: string) => void
  onCancel: () => void
}

export default function ReplyForm({ onSubmit, onCancel }: ReplyFormProps) {
  const [text, setText] = useState('')
  const searchParams = useSearchParams()
  const nickname = searchParams.get('nickname') || 'Anônimo'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim()) {
      onSubmit(text, nickname)
      setText('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="bg-[#2B3D4F] text-white placeholder:text-[#66829F] w-full p-2 border border-[#66829F] outline-none rounded mb-2"
        placeholder="Comentário..."
        required
      />
      <button
        type="submit"
        className="mb-2 bg-transparent border text-sm border-[#66829F] text-white p-2 rounded hover:brightness-105 hover:bg-[#354A5F] mr-2"
      >
        Enviar Resposta
      </button>
      <button
        onClick={onCancel}
        className="mb-2 bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
      >
        Cancelar
      </button>
    </form>
  )
}