export interface Message {
    id: string;
    sender_id: string;
    receiver_id?: string;
    group_id?: string;
    content: string;
    type: "text" | "image" | "file" | "system";
    created_at: string;
    read?: boolean;
    read_by?: string[];
    reactions?: Array<{ emoji: string; user_id: string; user_name?: string }>;
    reply_to_id?: string;
    reply_to?: Message;
    pinned?: boolean;
    starred?: boolean;
    is_deleted?: boolean;
    deleted_for_everyone?: boolean;
    file_url?: string;
    file_name?: string;
    file_type?: string;
    file_size?: number;
}

export interface ChatTab {
    id: string;
    userId?: string;
    userName: string;
    userAvatar?: string;
    type?: 'direct' | 'group';
    unreadCount: number;
    lastMessage?: string;
    lastMessageTime?: string;
    muted?: boolean;
}

export interface UserStatus {
    userId: string;
    isOnline: boolean;
    lastSeen?: string;
}
