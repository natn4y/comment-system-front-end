import { useRef, useState } from 'react'
import ReplyForm from './ReplyForm'
import EditForm from './EditForm'
import CommentOptions from './CommentOptions'

interface Comment {
  id?: string
  nickname: string
  text: string
  createdAt?: string
  parentId?: string
  likes: number
  edited?: boolean
}

interface CommentItemProps {
  comment: Comment
  onLike: (commentId: string) => void
  onEdit: (commentId: string, text: string) => void
  onDelete: (commentId: string) => void
  onReply: (comment: { nickname: string; text: string; parentId: string }) => void
  replies: Comment[]
  renderComment: (comment: Comment) => JSX.Element
}

export default function CommentItem({ comment, onLike, onEdit, onDelete, onReply, replies, renderComment }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showFullText, setShowFullText] = useState(false)

  const isLongText = comment.text.split('\n').length > 3

  return (
    <div className="group border-l bg-[#354A5F] border-[#66829F] p-4">
      <div className='flex flex-wrap items-center justify-between md:justify-start gap-4'>
        <p className="mb-[0.10rem] font-semibold text-[#66829F]">
          {comment.nickname} {comment.edited && <span>(Editado)</span>}
        </p>
        <CommentOptions
          onLike={() => onLike(comment.id!)}
          onReply={() => setShowReplyForm(true)}
          onEdit={() => setShowEditForm(true)}
          onDelete={() => onDelete(comment.id!)}
          likes={comment.likes}
        />
      </div>

      {showEditForm ? (
        <EditForm
          initialText={comment.text}
          onSubmit={(text) => {
            onEdit(comment.id!, text)
            setShowEditForm(false)
          }}
          onCancel={() => setShowEditForm(false)}
        />
      ) : (
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
      )}

      {showReplyForm && (
        <ReplyForm
          onSubmit={(text, nickname) => {
            onReply({ nickname, text, parentId: comment.id! })
            setShowReplyForm(false)
          }}
          onCancel={() => setShowReplyForm(false)}
        />
      )}

      <div className="ml-5 mt-2 space-y-2">
        {replies.map(renderComment)}
      </div>
    </div>
  )
}