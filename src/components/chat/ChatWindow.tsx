import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Paperclip, Phone, Send, Video, Sparkles, X, FileText, Image as ImageIcon, Pin as PinIcon } from "lucide-react";
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChatActionsMenu } from "./ChatActionsMenu";
import { ChatBubble } from "./ChatBubble";
import { AttachmentMenu } from "./AttachmentMenu";
import { AttachmentPreview } from "./AttachmentPreview";
import { ForwardMessageDialog } from "./ForwardMessageDialog";
import { MessageInfoDialog } from "./MessageInfoDialog";
import { StarredMessagesDialog } from "./StarredMessagesDialog";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { api } from "@/services/api";
import { supabase } from "@/lib/supabase";
import { chatSocketService } from "@/services/chatSocket";

interface Message {
    id: string;
    sender_id: string;
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
    file_url?: string;
    file_name?: string;
    file_type?: string;
    file_size?: number;
    is_edited?: boolean;
    edited_at?: string;
    edit_count?: number;
    delivered_by?: string[];
}

interface ChatTab {
    id: string;
    userId?: string;
    userId?: string;
    userName: string;
    userRole?: string; // Added userRole
    userAvatar?: string;
    type?: 'direct' | 'group';
    muted?: boolean;
    isArchived?: boolean;
}

interface UserStatus {
    userId: string;
    isOnline: boolean;
    lastSeen?: string;
}

interface ChatWindowProps {
    activeChat: ChatTab;
    messages: Message[];
    currentUser: { id: string; name: string };
    onSendMessage: (content: string, type: "text" | "image" | "file", replyTo?: Message | null, fileMetadata?: any) => void;
    onBack: () => void;
    isMobile: boolean;
    statusMap: Record<string, UserStatus>;
    onMute: (muted: boolean) => void;
    onClear: () => void;
    onDelete: () => void;
    onArchive: (chatId: string, archived: boolean) => void;
    onCall: (type: 'audio' | 'video') => void;
    chats: ChatTab[];
    onAddReaction: (messageId: string, emoji: string) => void;
    onRemoveReaction: (messageId: string, emoji: string) => void;
    onRefreshMessages?: () => void;
    onLeaveGroup?: () => void;
    users?: Array<{ id: string; name: string; }>;
    onEditMessage?: (id: string, content: string) => void;
    typingUsers?: Record<string, boolean>;
}

import { GroupInfoSidebar } from "./GroupInfoSidebar";
import { AddMembersDialog } from "./AddMembersDialog";

export function ChatWindow({
    activeChat,
    messages,
    currentUser,
    onSendMessage,
    onBack,
    isMobile,
    statusMap,
    onMute,
    onClear,
    onDelete,
    onArchive,
    onCall,
    chats = [],
    onAddReaction,
    onRemoveReaction,
    onRefreshMessages,
    onLeaveGroup,
    users = [],
    onEditMessage,
    typingUsers = {}
}: ChatWindowProps) {
    const [inputValue, setInputValue] = useState("");
    const [isEmojiOpen, setIsEmojiOpen] = useState(false);
    const [showGroupInfo, setShowGroupInfo] = useState(false);
    const [isAddMembersOpen, setIsAddMembersOpen] = useState(false);
    const [groupInfoKey, setGroupInfoKey] = useState(0);

    // New state for message actions
    const [replyTo, setReplyTo] = useState<Message | null>(null);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [forwardMessage, setForwardMessage] = useState<Message | null>(null);
    const [infoMessage, setInfoMessage] = useState<Message | null>(null);
    const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
    const [isStarredOpen, setIsStarredOpen] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, activeChat.id]);

    const handleSend = () => {
        handleSendWithAttachments();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendWithAttachments();
        }
    };

    // Message action handlers
    const handleReply = (message: Message) => {
        setReplyTo(message);
    };

    const handleCopy = (content: string) => {
        toast.success("Message copied to clipboard");
    };

    const handleReact = (message: Message) => {
        // Reaction picker is handled by MessageReactions component
    };

    const handleForward = (message: Message) => {
        setForwardMessage(message);
    };

    const handlePin = async (message: Message) => {
        try {
            const newPinned = !message.pinned;
            await api.pinMessage(message.id, newPinned);
            toast.success(newPinned ? "Message pinned" : "Message unpinned");
            onRefreshMessages?.();
        } catch (error) {
            toast.error("Failed to update pin status");
        }
    };

    const handleStar = async (message: Message) => {
        try {
            const newStarred = !message.starred;
            await api.starMessage(message.id, currentUser.id, newStarred);
            toast.success(newStarred ? "Message starred" : "Message unstarred");
            onRefreshMessages?.();
        } catch (error) {
            toast.error("Failed to update star status");
        }
    };

    const handleDelete = async (message: Message, deleteForEveryone: boolean) => {
        try {
            const res = await api.deleteChatMessage(message.id, currentUser.id, deleteForEveryone);
            if (res.error) {
                toast.error(res.error);
                return;
            }
            toast.success(deleteForEveryone ? "Message deleted for everyone" : "Message deleted");
            onRefreshMessages?.();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete message");
        }
    };

    const handleInfo = (message: Message) => {
        setInfoMessage(message);
    };

    const handleAddReaction = (messageId: string, emoji: string) => {
        onAddReaction(messageId, emoji);
    };

    const handleRemoveReaction = (messageId: string, emoji: string) => {
        onRemoveReaction(messageId, emoji);
    };

    const handleFileSelect = (files: FileList, type: "document" | "image" | "video" | "audio") => {
        const newFiles = Array.from(files);
        setAttachments(prev => [...prev, ...newFiles]);
        toast.success(`${newFiles.length} file(s) selected`);
    };

    const handleRemoveAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleForwardToChats = (chatIds: string[]) => {
        // TODO: Implement forward API call
        toast.success(`Message forwarded to ${chatIds.length} chat(s)`);
        setForwardMessage(null);
    };

    const handleSendWithAttachments = async () => {
        if (!inputValue.trim() && attachments.length === 0) return;

        if (editingMessage && onEditMessage) {
            onEditMessage(editingMessage.id, inputValue);
            setEditingMessage(null);
            setInputValue("");
            return;
        }

        if (attachments.length > 0) {
            setUploading(true);
            try {
                // Currently only supporting one attachment at a time for simplicity in DB schema
                const file = attachments[0];
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}${Date.now()}.${fileExt}`;
                const filePath = `chat/${fileName}`;

                const { data, error } = await supabase.storage
                    .from('chat-attachments')
                    .upload(filePath, file);

                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage
                    .from('chat-attachments')
                    .getPublicUrl(filePath);

                const fileType = file.type.startsWith('image/') ? 'image' : 'file';
                const metadata = {
                    file_url: publicUrl,
                    file_name: file.name,
                    file_type: file.type,
                    file_size: file.size
                };

                onSendMessage(inputValue, fileType as any, replyTo, metadata);
                setAttachments([]);
            } catch (error: any) {
                console.error("Upload error:", error);
                toast.error("Failed to upload attachment: " + error.message);
                return;
            } finally {
                setUploading(false);
            }
        } else {
            onSendMessage(inputValue, "text", replyTo);
        }

        setInputValue("");
        setReplyTo(null);
    };

    const isGroup = activeChat.type === 'group' || (activeChat.id && activeChat.id.startsWith('group-'));
    const status = activeChat.userId ? statusMap[activeChat.userId] : null;
    const isTyping = !isGroup && activeChat.userId ? typingUsers[activeChat.userId] : false; // Simple support for 1:1 typing

    const pinnedMessages = messages.filter(m => m.pinned);
    const latestPinned = pinnedMessages[pinnedMessages.length - 1];



    const scrollToMessage = (messageId: string) => {
        const element = document.getElementById(`msg-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('animate-highlight');
            setTimeout(() => element.classList.remove('animate-highlight'), 2000);
        }
    };

    return (
        <div className="flex-1 flex h-full min-w-0 bg-background overflow-hidden relative">
            <div className="flex-1 flex flex-col min-w-0 h-full">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30 shrink-0 h-16">
                    <div
                        className="flex items-center gap-3 overflow-hidden cursor-pointer hover:bg-muted/50 p-1 -ml-1 pr-3 rounded-lg transition-colors group/header"
                        title="View Info"
                        onClick={(e) => {
                            e.preventDefault();
                            setShowGroupInfo(!showGroupInfo);
                        }}
                    >
                        {isMobile && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0 -ml-1 mr-1"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onBack();
                                }}
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        )}

                        <Avatar className="h-10 w-10 border border-border/50 shrink-0">
                            <AvatarImage src={activeChat.userAvatar} />
                            <AvatarFallback className="text-sm bg-primary/10 text-primary font-medium">
                                {activeChat.userName ? activeChat.userName.substring(0, 2).toUpperCase() : '??'}
                            </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm truncate group-hover/header:text-primary transition-colors">{activeChat.userName}</h4>
                                {activeChat.userRole && (
                                    <Badge variant="outline" className="text-[10px] h-4 px-1 font-normal capitalize bg-background/50">
                                        {activeChat.userRole.replace('_', ' ')}
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                                <span className="truncate">
                                    {isGroup ? "View group info" : (
                                        isTyping ? <span className="text-primary animate-pulse font-medium">typing...</span> :
                                            !status ? "Offline" :
                                                status.isOnline ? "Online" :
                                                    status.lastSeen ? `Last seen ${formatDistanceToNow(new Date(status.lastSeen), { addSuffix: true })}` : "Offline"
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground rounded-full hover:bg-muted"
                            title="Video Call"
                            onClick={() => onCall('video')}
                            disabled={isGroup}
                        >
                            <Video className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground rounded-full hover:bg-muted"
                            title="Voice Call"
                            onClick={() => onCall('audio')}
                            disabled={isGroup}
                        >
                            <Phone className="h-5 w-5" />
                        </Button>
                        <div className="w-px h-6 bg-border mx-1" />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 text-indigo-600 hover:text-indigo-700 hover:bg-gradient-to-tr hover:from-indigo-500/20 hover:to-purple-500/20 transition-all duration-300 group"
                            title="AI Assistant"
                            onClick={() => window.dispatchEvent(new CustomEvent("toggle-ai-assistant"))}
                        >
                            <Sparkles className="h-5 w-5 animate-pulse-slow group-hover:scale-110 transition-transform" />
                        </Button>
                        <div className="flex items-center gap-1.5 min-w-0">
                            <ChatActionsMenu
                                isGroup={!!isGroup}
                                isMuted={!!activeChat.muted}
                                isArchived={!!activeChat.isArchived}
                                onMute={() => onMute(!activeChat.muted)}
                                onClear={onClear}
                                onDelete={onDelete}
                                onArchive={() => onArchive(activeChat.id, !activeChat.isArchived)}
                                onViewInfo={() => setShowGroupInfo(true)}
                                onViewStarred={() => setIsStarredOpen(true)}
                            />
                        </div>
                    </div>
                </div>

                {/* Pinned Messages Bar */}
                {latestPinned && (
                    <div
                        className="flex items-center justify-between px-4 py-2 bg-muted/20 border-b border-border/50 animate-in slide-in-from-top duration-300 cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => scrollToMessage(latestPinned.id)}
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <PinIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-primary">Pinned Message</p>
                                <p className="text-[11px] text-muted-foreground truncate">
                                    {latestPinned.type === 'text' ? latestPinned.content : `[${latestPinned.type}]`}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] text-primary hover:text-primary hover:bg-primary/10"
                            onClick={(e) => {
                                e.stopPropagation();
                                scrollToMessage(latestPinned.id);
                            }}
                        >
                            VIEW
                        </Button>
                    </div>
                )}

                {/* Messages */}
                <ScrollArea className="flex-1 p-4 bg-[url('https://camo.githubusercontent.com/85effea159ba5a05e263a23ccbf47535b54630e46631ad0524451a5e1140081d/68747470733a2f2f692e696d6775722e636f6d2f5a5a557878366d2e706e67')] bg-repeat bg-opacity-5">
                    <div className="flex flex-col gap-1 min-h-0" ref={scrollRef}>
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 opacity-50">
                                <Avatar className="h-16 w-16 mb-4 grayscale opacity-50">
                                    <AvatarImage src={activeChat.userAvatar} />
                                    <AvatarFallback className="text-xl">
                                        {activeChat.userName ? activeChat.userName.substring(0, 2).toUpperCase() : '??'}
                                    </AvatarFallback>
                                </Avatar>
                                <p className="text-sm">Start the conversation with {activeChat.userName}</p>
                            </div>
                        ) : (
                            messages.map((msg, i) => {
                                const prevMsg = messages[i - 1];
                                const showAvatar = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                                const showName = isGroup && showAvatar;

                                return (
                                    <div key={msg.id} id={`msg-${msg.id}`} className="scroll-mt-20">
                                        <ChatBubble
                                            message={msg}
                                            isMe={msg.sender_id === currentUser.id}
                                            showAvatar={showAvatar}
                                            showName={showName}
                                            onReply={handleReply}
                                            onCopy={handleCopy}
                                            onReact={handleReact}
                                            onForward={handleForward}
                                            onPin={handlePin}
                                            onStar={handleStar}
                                            onDelete={handleDelete}
                                            onInfo={handleInfo}
                                            onAddReaction={handleAddReaction}
                                            onRemoveReaction={handleRemoveReaction}
                                            onEdit={(msg) => {
                                                setEditingMessage(msg);
                                                setInputValue(msg.content);
                                                // Focus input
                                                const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                                                if (input) input.focus();
                                            }}
                                            currentUserId={currentUser.id}
                                            deliveryStatus={
                                                msg.read ? 'read' :
                                                    (msg.delivered_by && msg.delivered_by.length > 0) ? 'delivered' : 'sent'

                                            }
                                            senderName={
                                                msg.sender_id === currentUser.id ? 'You' :
                                                    (users.find(u => u.id === msg.sender_id)?.name ||
                                                        (activeChat.type !== 'group' && activeChat.userId === msg.sender_id ? activeChat.userName : null))
                                            }
                                        />
                                    </div>
                                );
                            })
                        )}
                        <div ref={bottomRef} className="h-1" />
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="shrink-0">
                    {/* Edit Preview */}
                    {editingMessage && (
                        <div className="px-4 py-2 bg-muted/50 border-t border-border flex items-center justify-between border-l-4 border-l-blue-500">
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-blue-500 flex items-center gap-1">
                                    <Sparkles className="h-3 w-3" />
                                    Editing Message
                                </div>
                                <div className="text-sm truncate opacity-70">
                                    {editingMessage.content}
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0"
                                onClick={() => {
                                    setEditingMessage(null);
                                    setInputValue("");
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {/* Reply Preview */}
                    {replyTo && (
                        <div className="px-4 py-2 bg-muted/50 border-t border-border flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-primary">Replying to {replyTo.sender_id === currentUser.id ? "yourself" : (isGroup ? "Sender" : activeChat.userName)}</div>
                                <div className="text-sm truncate opacity-70 flex items-center gap-1">
                                    {replyTo.type === "image" ? (
                                        <>
                                            <ImageIcon className="h-3 w-3" />
                                            <span>Photo</span>
                                        </>
                                    ) : replyTo.type === "file" ? (
                                        <>
                                            <FileText className="h-3 w-3" />
                                            <span>{replyTo.file_name || "File"}</span>
                                        </>
                                    ) : (
                                        replyTo.content
                                    )}
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0"
                                onClick={() => setReplyTo(null)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {/* Attachment Preview */}
                    <AttachmentPreview files={attachments} onRemove={handleRemoveAttachment} />

                    <div className="px-4 py-3 bg-muted/30 border-t border-border">
                        <div className="flex items-end gap-2 max-w-4xl mx-auto relative z-20">
                            <Popover open={isEmojiOpen} onOpenChange={setIsEmojiOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 text-muted-foreground hover:text-foreground shrink-0 rounded-full"
                                        title="Emoji"
                                        type="button"
                                    >
                                        <span className="text-xl">😊</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    side="top"
                                    align="start"
                                    className="w-[350px] p-0 border-none shadow-xl bg-background rounded-xl"
                                    sideOffset={15}
                                >
                                    <div className="emoji-picker-wrapper">
                                        <style>{`
                                            .emoji-picker-wrapper button {
                                                min-height: 0 !important;
                                            }
                                            .epr-emoji-category-label {
                                                height: auto !important;
                                            }
                                        `}</style>
                                        <EmojiPicker
                                            onEmojiClick={(emojiData) => {
                                                setInputValue(prev => prev + emojiData.emoji);
                                            }}
                                            width={350}
                                            height={450}
                                            lazyLoadEmojis={true}
                                            previewConfig={{ showPreview: false }}
                                            searchDisabled={false}
                                            skinTonesDisabled={false}
                                            theme={Theme.AUTO}
                                            style={{
                                                backgroundColor: "var(--background)",
                                                borderColor: "var(--border)",
                                                "--epr-bg-color": "var(--background)",
                                                "--epr-category-label-bg-color": "var(--background)",
                                                "--epr-text-color": "var(--foreground)",
                                                border: "none"
                                            } as any}
                                        />
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <AttachmentMenu
                                onFileSelect={handleFileSelect}
                                open={isAttachMenuOpen}
                                onOpenChange={setIsAttachMenuOpen}
                            />

                            <div className="flex-1 bg-background rounded-2xl border border-input/50 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all shadow-sm flex items-center min-h-[42px] px-3 py-1">
                                <Input
                                    className="flex-1 border-none bg-transparent shadow-none focus-visible:ring-0 min-h-[24px] max-h-[120px] py-1 px-1 resize-none overflow-hidden placeholder:text-muted-foreground/70"
                                    placeholder="Type a message"
                                    value={inputValue}
                                    onChange={(e) => {
                                        setInputValue(e.target.value);
                                        // Emit typing event
                                        if (activeChat.userId || activeChat.id) {
                                            const roomId = activeChat.type === 'group' ? activeChat.id.replace('group-', '') : `user_${activeChat.userId}`;
                                            // Actually server expects 'user_ID' for 1:1 room listening?
                                            // socket.js: socket.on("typing", ({ roomId ... }) => socket.to(roomId).emit...)
                                            // For 1:1, we should probably emit to the OTHER user's personal room?
                                            // No, usually in 1:1 we join a common room or emit to user specific room.
                                            // socket.js says: `socket.to(roomId).emit`
                                            // If I send to `user_OTHER_ID`, they will receive it.
                                            // So roomId should be `user_${otherUserId}`.
                                            const targetRoom = activeChat.type === 'group'
                                                ? activeChat.id
                                                : `user_${activeChat.userId}`; // Use activeChat.userId (UUID) logic from socket.js join

                                            chatSocketService.emitTyping(targetRoom, true);
                                            // Debounce stop typing?
                                            // For now just emit true, server/client can handle timeout or we add debounce here.
                                            // Adding simple debounce:
                                            const timeoutId = setTimeout(() => {
                                                chatSocketService.emitTyping(targetRoom, false);
                                            }, 3000);
                                            return () => clearTimeout(timeoutId);
                                        }
                                    }}
                                    onKeyDown={handleKeyDown}
                                    autoComplete="off"
                                />
                            </div>

                            <Button
                                size="icon"
                                className={cn(
                                    "h-10 w-10 rounded-full shrink-0 transition-all",
                                    (inputValue.trim() || attachments.length > 0) ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm" : "bg-transparent text-muted-foreground hover:bg-muted"
                                )}
                                onClick={handleSendWithAttachments}
                                disabled={(!inputValue.trim() && attachments.length === 0) || uploading}
                            >
                                {uploading ? (
                                    <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
                                ) : (inputValue.trim() || attachments.length > 0) ? (
                                    <Send className="h-5 w-5 ml-0.5" />
                                ) : (
                                    <Phone className="h-5 w-5" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Group Info Sidebar */}
            {showGroupInfo && isGroup && (
                <GroupInfoSidebar
                    groupId={activeChat.id.replace('group-', '')}
                    currentUserId={currentUser.id}
                    onClose={() => setShowGroupInfo(false)}
                    onAddMember={() => setIsAddMembersOpen(true)}
                    onLeaveGroup={onLeaveGroup}
                    isMobile={isMobile}
                    key={groupInfoKey}
                />
            )}

            {/* Add Members Dialog */}
            {isAddMembersOpen && (
                <AddMembersDialog
                    open={isAddMembersOpen}
                    onOpenChange={setIsAddMembersOpen}
                    groupId={activeChat.id.replace('group-', '')}
                    currentMemberIds={messages.filter(m => m.sender_id).map(m => m.sender_id)} // Fallback if members not passed
                    onMembersAdded={() => setGroupInfoKey(k => k + 1)}
                />
            )}

            {/* Forward Message Dialog */}
            {forwardMessage && (
                <ForwardMessageDialog
                    open={!!forwardMessage}
                    onOpenChange={(open) => !open && setForwardMessage(null)}
                    message={forwardMessage}
                    chats={chats.filter(c => c.id !== activeChat.id)}
                    onForward={handleForwardToChats}
                />
            )}

            {/* Message Info Dialog */}
            {infoMessage && (
                <MessageInfoDialog
                    open={!!infoMessage}
                    onOpenChange={(open) => !open && setInfoMessage(null)}
                    message={infoMessage}
                    isGroup={isGroup}
                    groupMembers={[]} // TODO: Pass actual group members
                />
            )}

            {/* Starred Messages Dialog */}
            <StarredMessagesDialog
                open={isStarredOpen}
                onOpenChange={setIsStarredOpen}
                messages={messages}
                currentUserId={currentUser.id}
            />
        </div>
    );
}
