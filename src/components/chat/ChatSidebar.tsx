import { useState } from "react";
import { MessageSquare, Search, Users, VolumeX, Archive, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { NewChatDialog } from "./NewChatDialog";
import { CreateGroupDialog } from "./CreateGroupDialog";

interface User {
    id: string;
    name: string;
    avatar?: string;
    email?: string;
}

interface ChatTab {
    id: string;
    userId?: string; // For 1:1
    type?: 'direct' | 'group';
    userName: string;
    userAvatar?: string; // Or group icon
    unreadCount: number;
    lastMessage?: string;
    lastMessageTime?: string;
    muted?: boolean;
    isOnline?: boolean; // Added to fix TypeScript error
}

interface UserStatus {
    userId: string;
    isOnline: boolean;
    lastSeen?: string;
}

interface ChatSidebarProps {
    chats: ChatTab[];
    selectedChatId: string | null;
    onSelectChat: (chat: ChatTab) => void;
    users: User[];
    currentUser: { id: string; name: string; avatar?: string }; // Added avatar property
    statusMap: Record<string, UserStatus>;
    className?: string;
    onGroupCreated: () => void;
    isMobile?: boolean; // Added optional prop
    onCloseMobile?: () => void; // Added optional prop
}

export function ChatSidebar({
    chats,
    selectedChatId,
    onSelectChat,
    users,
    currentUser,
    statusMap,
    className,
    onGroupCreated,
    isMobile,
    onCloseMobile
}: ChatSidebarProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
    const [filter, setFilter] = useState<'All' | 'Unread' | 'Groups'>('All');

    const filteredChats = chats.filter(chat => {
        // 1. Text Search
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = (chat.userName || '').toLowerCase().includes(searchLower) ||
            (chat.lastMessage && chat.lastMessage.toLowerCase().includes(searchLower));

        if (!matchesSearch) return false;

        // 2. Chip Filters
        if (filter === 'Unread') return (chat.unreadCount || 0) > 0;
        if (filter === 'Groups') return chat.type === 'group';

        return true;
    });

    const handleStartChat = (user: User) => {
        // Check if chat already exists in recent list
        const existingChat = chats.find(c => c.userId === user.id && (!c.type || c.type === 'direct'));
        if (existingChat) {
            onSelectChat(existingChat);
        } else {
            // Create a temporary chat object to pass up
            const newChat: ChatTab = {
                id: `recent-${user.id}`,
                userId: user.id,
                type: 'direct',
                userName: user.name,
                userAvatar: user.avatar,
                unreadCount: 0
            };
            onSelectChat(newChat);
        }
        setIsNewChatOpen(false);
    };

    return (
        <div className={cn("flex flex-col h-full bg-background", isMobile ? "w-full" : "w-full")}>
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 bg-muted/30 shrink-0 h-16">
                <div className="flex items-center gap-2">
                    <Avatar className="h-9 w-9 border border-border cursor-pointer transition-opacity hover:opacity-80">
                        <AvatarImage src={currentUser?.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : '??'}
                        </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm hidden lg:inline-block">Chats</span>
                </div>

                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground rounded-full"
                        title="New Chat"
                        onClick={() => setIsNewChatOpen(true)}
                    >
                        <MessageSquare className="h-5 w-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground rounded-full"
                        title="Create Group"
                        onClick={() => setIsCreateGroupOpen(true)}
                    >
                        <Users className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="p-3 pb-2 space-y-3 border-b border-border">
                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <Search className="h-4 w-4" />
                    </div>
                    <Input
                        placeholder="Search or start new chat"
                        className="pl-10 h-9 bg-muted/50 border-input/50 focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-primary/20 rounded-lg text-sm transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    {['All', 'Unread', 'Groups'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={cn(
                                "px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
                                filter === f
                                    ? "bg-primary/10 text-primary" // Reverted to original primary styling
                                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat List */}
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {/* Archived section - added from the provided code */}
                    <div className="px-2 pb-1.5 pt-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                        <Archive className="h-3.5 w-3.5" />
                        <span>Archived</span>
                    </div>

                    {filteredChats.map((chat) => (
                        <div
                            key={chat.id}
                            onClick={() => {
                                onSelectChat(chat);
                                if (isMobile && onCloseMobile) onCloseMobile();
                            }}
                            className={cn(
                                "group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-muted/50 relative",
                                selectedChatId === chat.id && "bg-muted shadow-sm"
                            )}
                        >
                            <div className="relative shrink-0">
                                <Avatar className="h-12 w-12 border border-border/40">
                                    <AvatarImage src={chat.userAvatar} />
                                    <AvatarFallback className="bg-primary/5 text-primary text-sm font-medium">
                                        {chat.userName ? chat.userName.substring(0, 2).toUpperCase() : '??'}
                                    </AvatarFallback>
                                </Avatar>
                                {chat.isOnline && ( // Using isOnline directly from ChatTab
                                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-sm truncate text-foreground">{chat.userName}</h4>
                                    {chat.lastMessageTime && (
                                        <span className={cn(
                                            "text-[10px] shrink-0",
                                            (chat.unreadCount || 0) > 0 ? "text-green-600 font-medium" : "text-muted-foreground"
                                        )}>
                                            {formatDistanceToNow(new Date(chat.lastMessageTime), { addSuffix: false })}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground truncate max-w-[85%]">
                                        <span className="truncate">{chat.lastMessage || "No messages yet"}</span>
                                    </div>

                                    <div className="flex flex-col gap-1 items-end">
                                        {(chat.unreadCount || 0) > 0 && (
                                            <span className="flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-green-500 text-[10px] font-bold text-white shadow-sm">
                                                {chat.unreadCount}
                                            </span>
                                        )}
                                        {chat.muted && (
                                            <VolumeX className="h-3 w-3 text-muted-foreground" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredChats.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground">
                            <p className="text-sm">No chats found.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Dialogs */}
            <NewChatDialog
                open={isNewChatOpen}
                onOpenChange={setIsNewChatOpen}
                users={users}
                currentUser={currentUser}
                onStartChat={handleStartChat}
                onGroupCreated={onGroupCreated}
            />

            <CreateGroupDialog
                open={isCreateGroupOpen}
                onOpenChange={setIsCreateGroupOpen}
                onGroupCreated={onGroupCreated}
                currentUserId={currentUser.id}
            />
        </div>
    );
}
