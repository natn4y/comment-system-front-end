"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import io, { Socket } from "socket.io-client";
import CommentForm from "./_components/CommentForm";
import CommentList from "./_components/CommentList";

interface Comment {
  id?: string;
  nickname: string;
  text: string;
  createdAt?: string;
  parentId?: string;
  likes: number;
  edited?: boolean;
}

let socket: Socket;

// Componente wrapper que usa o padrão de hidratação
export default function Comments() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-[#2B3D4F] text-white p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return <CommentsContent />;
}

// O conteúdo real do componente, que só será renderizado no cliente
function CommentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const nickname = searchParams.get("nickname");
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  const [comments, setComments] = useState<Comment[]>([]);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;

  const updateUrlPage = useCallback(
    (newPage: number) => {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set("page", newPage.toString());
      router.push(`?${newSearchParams.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  const loadMoreComments = useCallback(() => {
    if (!loading && hasMore) {
      setPage((prevPage) => prevPage + 1);
    }
  }, [loading, hasMore]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 100
      ) {
        loadMoreComments();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMoreComments]);

  useEffect(() => {
    const initSocket = async () => {
      socket = io(process.env.NEXT_PUBLIC_SOCKET_ADDRESS!, {
        path: "/socket",
      });

      socket.on("connect", () => {
        console.log("Connected to socket server");
      });

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });

      socket.on("newComment", (newComment: Comment) => {
        setComments((prevComments) => [newComment, ...prevComments]);
      });

      socket.on("updateComment", (updatedComment: Comment) => {
        setComments((prevComments) =>
          prevComments.map((c) =>
            c.id === updatedComment.id ? updatedComment : c
          )
        );
      });

      socket.on("deleteComment", ({ commentId }) => {
        setComments((prevComments) =>
          prevComments.filter((c) => c.id !== commentId)
        );
      });

      socket.on("likeComment", ({ commentId, likes }) => {
        setComments((prevComments) =>
          prevComments.map((c) => (c.id === commentId ? { ...c, likes } : c))
        );
      });
    };

    initSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const fetchComments = useCallback(async () => {
    if (!hasMore) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/comments?page=${page}&limit=${limit}`);
      const data = await res.json();

      if (data.comments.length > 0) {
        setComments((prevComments) => {
          const newComments = data.comments.filter(
            (newComment: Comment) =>
              !prevComments.some(
                (prevComment) => prevComment.id === newComment.id
              )
          );

          if (newComments.length > 0) {
            updateUrlPage(page);
            return [...prevComments, ...newComments];
          }
          return prevComments;
        });

        setHasMore(data.comments.length === limit);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, updateUrlPage, hasMore]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = (
    newComment: Omit<Comment, "id" | "createdAt" | "likes" | "edited">
  ) => {
    const commentWithNickname: Comment = {
      ...newComment,
      nickname: nickname || "Anônimo",
      likes: 0,
      edited: false,
      createdAt: new Date().toISOString(),
    };
    socket.emit("comment", commentWithNickname);
  };

  const handleLike = (commentId: string) => {
    socket.emit("likeComment", { commentId });
  };

  const handleEdit = (commentId: string, text: string) => {
    socket.emit("updateComment", { id: commentId, text, edited: true });
  };

  const handleDelete = (commentId: string) => {
    socket.emit("deleteComment", { commentId });
  };

  return (
    <div className="min-h-screen bg-[#2B3D4F] text-white p-8">
      <div className="mb-8">
        <p>
          Olá, <span className="text-[#66829F]">{nickname}</span>
        </p>
      </div>
      <CommentForm onSubmit={handleSubmit} nickname={nickname as string} />
      <CommentList
        comments={comments}
        onLike={handleLike}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onReply={handleSubmit}
      />
      {!hasMore && (
        <p className="mt-4 text-center">
          Não há mais comentários para carregar.
        </p>
      )}
    </div>
  );
}
