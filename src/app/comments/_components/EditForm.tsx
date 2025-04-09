import { useState } from 'react'

interface EditFormProps {
  initialText: string
  onSubmit: (text: string) => void
  onCancel: () => void
}

export default function EditForm({ initialText, onSubmit, onCancel }: EditFormProps) {
  const [text, setText] = useState(initialText)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim()) {
      onSubmit(text)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
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
        onClick={onCancel}
        className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
      >
        Cancelar
      </button>
    </form>
  )
}