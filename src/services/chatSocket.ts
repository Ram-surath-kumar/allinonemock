import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

class ChatSocketService {
    private socket: Socket | null = null;
    private userId: string | null = null;

    connect(userId: string) {
        if (this.socket?.connected && this.userId === userId) return;

        this.disconnect();
        this.userId = userId;

        this.socket = io(SOCKET_URL, {
            query: { userId },
            transports: ['websocket'],
            reconnection: true,
        });

        this.socket.on('connect', () => {
            console.log('Connected to Chat Socket');
            this.socket?.emit('join', userId);
        });

        this.socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    onNewMessage(callback: (message: any) => void) {
        this.socket?.on('new_message', callback);
    }

    onMessageRead(callback: (data: any) => void) {
        this.socket?.on('message_read_update', callback);
        this.socket?.on('messages_read', callback);
    }

    onMessageDelivered(callback: (data: any) => void) {
        this.socket?.on('message_delivered_update', callback);
    }

    onTyping(callback: (data: any) => void) {
        this.socket?.on('typing', callback);
    }

    onUserStatus(callback: (data: any) => void) {
        this.socket?.on('user_status', callback);
    }

    emitTyping(roomId: string, isTyping: boolean) {
        this.socket?.emit('typing', { roomId, userId: this.userId, isTyping });
    }

    // Since we use REST for sending messages, we might not need an emitMessage here,
    // unless we want to bypass REST for speed. For now, sticking to REST as per plan + server code.
    // server/routes/chat.js handles saving and then emitting 'new_message'.
}

export const chatSocketService = new ChatSocketService();
