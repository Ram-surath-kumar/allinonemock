import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, MessageSquare, Search, Users, VolumeX, Archive, UserPlus, Bell, BellOff, Trash2 } from "lucide-react";
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
    isOnline?: boolean;
    isArchived?: boolean;
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
    onArchiveChat: (chatId: string, archived: boolean) => void;
    onMuteChat: (chatId: string, muted: boolean) => void;
    onDeleteChat: (chatId: string) => void;
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
    onArchiveChat,
    onMuteChat,
    onDeleteChat,
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

    const activeChats = filteredChats.filter(chat => !chat.isArchived);
    const archivedChats = filteredChats.filter(chat => chat.isArchived);
    const [showArchived, setShowArchived] = useState(false);

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
                {/* Archived row at top if there are archived chats - WhatsApp Style */}
                {archivedChats.length > 0 && (
                    <div className="px-1 pt-1">
                        <button
                            onClick={() => setShowArchived(!showArchived)}
                            className="w-full px-3 py-3 flex items-center justify-between text-sm font-medium hover:bg-muted/50 rounded-lg transition-colors group border-b border-border/40"
                        >
                            <div className="flex items-center gap-3">
                                <Archive className="h-4 w-4 text-primary" />
                                <span>Archived</span>
                            </div>
                            <span className="text-xs text-primary font-bold">
                                {archivedChats.length}
                            </span>
                        </button>

                        {showArchived && (
                            <div className="mt-1 space-y-0.5 animate-in slide-in-from-top-2 duration-200 mb-2">
                                {archivedChats.map((chat) => (
                                    <div
                                        key={chat.id}
                                        onClick={() => {
                                            onSelectChat(chat);
                                            if (isMobile && onCloseMobile) onCloseMobile();
                                        }}
                                        className={cn(
                                            "group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-muted/30 relative",
                                            selectedChatId === chat.id && "bg-muted shadow-sm"
                                        )}
                                    >
                                        <div className="relative shrink-0 opacity-80">
                                            <Avatar className="h-11 w-11 border border-border/40">
                                                <AvatarImage src={chat.userAvatar} />
                                                <AvatarFallback className="bg-primary/5 text-primary text-xs font-medium">
                                                    {chat.userName ? chat.userName.substring(0, 2).toUpperCase() : '??'}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>

                                        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-medium text-sm truncate text-foreground">{chat.userName}</h4>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchiveChat(chat.id, false); }}>
                                                            <Archive className="h-4 w-4 mr-2" />
                                                            Unarchive Chat
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMuteChat(chat.id, !chat.muted); }}>
                                                            {chat.muted ? <Bell className="h-4 w-4 mr-2" /> : <BellOff className="h-4 w-4 mr-2" />}
                                                            {chat.muted ? "Unmute" : "Mute"}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }} className="text-destructive">
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete Chat
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                                                <span className="truncate">{chat.lastMessage || "No messages yet"}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Active Chats */}
                {activeChats.map((chat) => (
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
                                        {(() => {
                                            try {
                                                const date = new Date(chat.lastMessageTime);
                                                return isNaN(date.getTime()) ? "" : formatDistanceToNow(date, { addSuffix: false });
                                            } catch (e) {
                                                return "";
                                            }
                                        })()}
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
                                    <div className="flex items-center gap-1">
                                        {chat.muted && (
                                            <VolumeX className="h-3 w-3 text-muted-foreground" />
                                        )}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchiveChat(chat.id, true); }}>
                                                    <Archive className="h-4 w-4 mr-2" />
                                                    Archive Chat
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMuteChat(chat.id, !chat.muted); }}>
                                                    {chat.muted ? <Bell className="h-4 w-4 mr-2" /> : <BellOff className="h-4 w-4 mr-2" />}
                                                    {chat.muted ? "Unmute" : "Mute"}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }} className="text-destructive">
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete Chat
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {activeChats.length === 0 && archivedChats.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                        <p className="text-sm">No chats found.</p>
                    </div>
                )}
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
