import { Server } from "socket.io";
import { supabaseAdmin } from './common.js';

let io;

export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "*", // Adjust in production
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log("Details: New Logger Connection:", socket.id);

        // User authentication/identification
        socket.on("join", (userId) => {
            console.log(`[Socket] Received join event from user: ${userId}`);
            if (userId) {
                const roomName = `user_${userId}`;
                console.log(`[SocketDebug] User ${userId} joining room: ${roomName}`);
                socket.join(roomName);

                // Verify join
                const rooms = Array.from(socket.rooms);
                console.log(`[SocketDebug] Socket ${socket.id} is now in rooms:`, rooms);

                // Also join all group rooms they are part of
                joinUserGroups(socket, userId);

                // Broadcast online status
                socket.broadcast.emit("user_status", { userId, isOnline: true });
            } else {
                console.warn(`[SocketWarning] Received join event with NO userId for socket ${socket.id}`);
            }
        });

        socket.on("typing", ({ roomId, userId, isTyping }) => {
            // roomId can be 'user_ID' for 1:1 or 'group_ID'
            socket.to(roomId).emit("typing", { roomId, userId, isTyping });
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
            // We'd need a mapping of socketId -> userId to broadcast offline status effectively
            // For now, client handles "last seen" via API
        });
    });

    return io;
};

const joinUserGroups = async (socket, userId) => {
    try {
        const { data: members } = await supabaseAdmin
            .from('group_members')
            .select('group_id')
            .eq('user_id', userId)
            .is('left_at', null);

        if (members) {
            members.forEach(m => {
                socket.join(m.group_id);
                console.log(`Socket ${socket.id} joined group ${m.group_id}`);
            });
        }
    } catch (error) {
        console.error("Error joining groups:", error);
    }
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};
