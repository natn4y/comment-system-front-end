import CommentItem from './CommentItem'

interface Comment {
  id?: string
  nickname: string
  text: string
  createdAt?: string
  parentId?: string
  likes: number
  edited?: boolean
}

interface CommentListProps {
  comments: Comment[]
  onLike: (commentId: string) => void
  onEdit: (commentId: string, text: string) => void
  onDelete: (commentId: string) => void
  onReply: (comment: Omit<Comment, 'id' | 'createdAt' | 'likes' | 'edited'>) => void
}

export default function CommentList({ comments, onLike, onEdit, onDelete, onReply }: CommentListProps) {
  const getReplies = (parentId: string) => {
    return comments.filter((comment) => comment.parentId === parentId)
  }

  const renderComment = (comment: Comment) => (
    <CommentItem
      key={comment.id}
      comment={comment}
      onLike={onLike}
      onEdit={onEdit}
      onDelete={onDelete}
      onReply={onReply}
      replies={getReplies(comment.id!)}
      renderComment={renderComment}
    />
  )

  return (
    <div className="space-y-4">
      {comments.filter((comment) => !comment.parentId).map(renderComment)}
    </div>
  )
}