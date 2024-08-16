import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    path: '/api/socket',
  });

  io.on("connection", (socket) => {
    console.log("New client connected");

    socket.on("comment", async (comment) => {
      try {
        const savedComment = await prisma.comment.create({
          data: {
            nickname: comment.nickname,
            text: comment.text,
            parentId: comment.parentId || null,
          },
        });

        io.emit("newComment", savedComment);
      } catch (error) {
        console.error("Error saving comment:", error);
      }
    });

    socket.on("updateComment", async (comment) => {
      try {
        const updateComment = await prisma.comment.update({
          where: {
            id: comment.id,
          },
          data: {
            nickname: comment.nickname,
            text: comment.text,
            edited: comment.edited,
          },
        });

        io.emit("updateComment", updateComment);
      } catch (error) {
        console.error("Error saving comment:", error);
      }
    });

    socket.on("likeComment", async ({ commentId }) => {
      try {
        // Verifique se o comentário existe
        const existingComment = await prisma.comment.findUnique({
          where: { id: commentId },
        });

        if (!existingComment) {
          console.error("Comment not found");
          return;
        }

        // Aqui você pode definir uma lógica personalizada para alternar entre like e unlike
        // Exemplo simples: Alternar entre like e unlike com base em um limite arbitrário
        const updatedLikes = existingComment.likes > 0 ? existingComment.likes - 1 : existingComment.likes + 1;

        // Atualize o número de likes no comentário
        const updatedComment = await prisma.comment.update({
          where: {
            id: commentId,
          },
          data: {
            likes: updatedLikes,
          },
        });

        // Emita o evento para todos os clientes com o ID e o número de likes atualizados
        io.emit("likeComment", { commentId: updatedComment.id, likes: updatedComment.likes });
      } catch (error) {
        console.error("Error updating likes:", error);
      }
    });


    socket.on("deleteComment", async ({ commentId }) => {
      try {
        // Função recursiva para excluir comentários e seus filhos
        const deleteCommentRecursively = async (id) => {
          // Primeiro, exclua todos os filhos do comentário atual
          const childComments = await prisma.comment.findMany({
            where: {
              parentId: id,
            },
          });

          // Exclua todos os filhos recursivamente
          for (const child of childComments) {
            await deleteCommentRecursively(child.id);
          }

          // Agora, exclua o comentário atual
          await prisma.comment.delete({
            where: {
              id: id,
            },
          });
        };

        // Inicie a exclusão recursiva a partir do comentário principal
        await deleteCommentRecursively(commentId);

        // Emita um evento para notificar a exclusão
        io.emit('deleteComment', { commentId });
      } catch (error) {
        console.error("Erro ao excluir o comentário:", error);
        // Emitir uma mensagem de erro ou realizar outras ações, se necessário
        io.emit('error', { message: 'Erro ao excluir o comentário' });
      }
    });


    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
