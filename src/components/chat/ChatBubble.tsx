import { useState } from "react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Check, CheckCheck, Play, FileText, Image as ImageIcon, Download, Paperclip, Pin, Star, X, MoreVertical } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MessageContextMenu } from "./MessageContextMenu";
import { MessageReactions } from "./MessageReactions";

interface Message {
    id: string;
    sender_id: string;
    content: string;
    type: "text" | "image" | "file" | "system";
    created_at: string;
    read?: boolean;
    file_url?: string;
    file_name?: string;
    file_size?: number;
    file_type?: string;
    reply_to?: {
        sender_id: string;
        content: string;
        type: string;
    };
    reactions?: Array<{ emoji: string; user_id: string; user_name?: string }>;
    pinned?: boolean;
    starred?: boolean;
    is_deleted?: boolean;
    deleted_for_everyone?: boolean;
    is_edited?: boolean;
    edited_at?: string;
    edit_count?: number;
}

interface ChatBubbleProps {
    message: Message;
    isMe: boolean;
    showAvatar?: boolean;
    showName?: boolean;
    onReply?: (message: any) => void;
    onCopy?: (content: string) => void;
    onReact?: (message: any) => void;
    onForward?: (message: any) => void;
    onPin?: (message: any) => void;
    onStar?: (message: any) => void;
    onDelete?: (message: any, everyone: boolean) => void;
    onEdit?: (message: any) => void;
    onInfo?: (message: any) => void;
    onAddReaction?: (messageId: string, emoji: string) => void;
    onRemoveReaction?: (messageId: string, emoji: string) => void;
    currentUserId?: string;
    deliveryStatus?: 'sent' | 'delivered' | 'read';
    senderName?: string;
}

export function ChatBubble({
    message,
    isMe,
    showAvatar = true,
    showName = false,
    onReply,
    onCopy,
    onReact,
    onForward,
    onPin,
    onStar,
    onDelete,
    onEdit,
    onInfo,
    onAddReaction,
    onRemoveReaction,
    currentUserId,
    deliveryStatus = 'sent',
    senderName,
}: ChatBubbleProps) {
    const [showPicker, setShowPicker] = useState(false);
    const time = format(new Date(message.created_at), "HH:mm");

    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!message.file_url) return;

        const link = document.createElement('a');
        link.href = message.file_url;
        link.download = message.file_name || 'download';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderContent = () => {
        if (message.is_deleted || message.deleted_for_everyone) {
            return (
                <p className="text-[14px] italic opacity-50 flex items-center gap-1.5">
                    <X className="h-3 w-3" />
                    This message was deleted
                </p>
            );
        }

        switch (message.type) {
            case "image":
                return (
                    <div
                        className="relative group cursor-pointer overflow-hidden rounded-lg"
                        onClick={handleDownload}
                    >
                        <img
                            src={message.file_url || message.content}
                            alt={message.file_name || "Sent image"}
                            className="max-w-full max-h-[300px] object-contain bg-muted/20 transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Download className="h-6 w-6 text-white" />
                        </div>
                    </div>
                );
            case "file":
                return (
                    <div
                        className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-border/50 hover:bg-background/80 transition-colors cursor-pointer group"
                        onClick={handleDownload}
                    >
                        <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{message.file_name || "Document"}</p>
                            <p className="text-xs text-muted-foreground">
                                {message.file_size ? `${(message.file_size / 1024 / 1024).toFixed(2)} MB` : "File"}
                            </p>
                        </div>
                        <Download className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                );
            default:
                return <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>;
        }
    };

    if (message.type === "system") {
        return (
            <div className="flex justify-center w-full my-4 px-4">
                <div className="bg-muted/40 text-muted-foreground px-4 py-1.5 rounded-lg text-[12px] font-medium shadow-sm border border-border/20 backdrop-blur-sm">
                    {message.content}
                </div>
            </div>
        );
    }

    const bubbleContent = (
        <div className={cn(
            "max-w-[85%] md:max-w-[70%] flex flex-col",
            isMe ? "items-end" : "items-start"
        )}>
            {showName && !isMe && (
                <span className="text-[12px] font-semibold text-primary/80 ml-2 mb-1">
                    {senderName || message.sender_id}
                </span>
            )}

            <Popover open={showPicker} onOpenChange={setShowPicker}>
                <PopoverTrigger asChild>
                    <div className={cn(
                        "relative group px-3 py-2 rounded-2xl shadow-sm transition-all duration-200 cursor-pointer",
                        isMe
                            ? "bg-primary text-primary-foreground rounded-tr-none hover:bg-primary/95"
                            : "bg-muted text-foreground rounded-tl-none hover:bg-muted/80",
                        message.type !== "text" && "p-1.5"
                    )}>
                        {/* Reply UI */}
                        {message.reply_to && (
                            <div className={cn(
                                "mb-2 p-2 rounded-lg border-l-4 text-xs bg-black/5 flex flex-col gap-0.5",
                                isMe ? "border-primary-foreground/30" : "border-primary/30"
                            )}>
                                <span className="font-bold opacity-80">
                                    {message.reply_to.sender_id === (isMe ? message.sender_id : "someone") ? "You" : "Sender"}
                                </span>
                                <span className="truncate opacity-70 italic">
                                    {message.reply_to.content}
                                </span>
                            </div>
                        )}

                        {renderContent()}

                        <div className={cn(
                            "flex items-center gap-1.5 mt-1 self-end select-none",
                            isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}>
                            {message.starred && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                            {message.pinned && <Pin className="h-3 w-3" />}
                            {message.is_edited && <span className="text-[10px] italic opacity-70">(edited)</span>}
                            <span className="text-[10px] tabular-nums font-medium">{time}</span>
                            {isMe && (
                                deliveryStatus === 'read' ? (
                                    <CheckCheck className="h-3 w-3 text-blue-500" />
                                ) : deliveryStatus === 'delivered' ? (
                                    <CheckCheck className="h-3 w-3 text-muted-foreground" />
                                ) : (
                                    <Check className="h-3 w-3" />
                                )
                            )}

                            {/* 3-dot menu icon - only visible on hover */}
                            <MessageContextMenu
                                message={message as any}
                                isMe={isMe}
                                onReply={() => onReply?.(message)}
                                onCopy={onCopy || (() => { })}
                                onReact={() => {
                                    setShowPicker(!showPicker);
                                    onReact?.(message);
                                }}
                                onForward={() => onForward?.(message)}
                                onPin={() => onPin?.(message)}
                                onStar={() => onStar?.(message)}
                                onDelete={onDelete || (() => { })}
                                onEdit={() => onEdit?.(message)}
                                onInfo={() => onInfo?.(message)}
                            >
                                <button
                                    type="button"
                                    className={cn(
                                        "opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-black/10",
                                        isMe ? "hover:bg-white/10" : "hover:bg-black/5"
                                    )}
                                    onClick={(e) => e.stopPropagation()}
                                    aria-label="Message options"
                                >
                                    <MoreVertical className="h-3.5 w-3.5" />
                                </button>
                            </MessageContextMenu>
                        </div>
                    </div>
                </PopoverTrigger>
                <PopoverContent
                    side="top"
                    align={isMe ? "end" : "start"}
                    className="p-0 border-none bg-transparent shadow-none w-auto"
                    sideOffset={5}
                >
                    <MessageReactions
                        message={message}
                        currentUserId={currentUserId || ''}
                        onAddReaction={onAddReaction!}
                        onRemoveReaction={onRemoveReaction!}
                        showPicker={showPicker}
                        onClosePicker={() => setShowPicker(false)}
                        isFloating={true}
                    />
                </PopoverContent>
            </Popover>

            {/* Reactions displayed below the message bubble (the small tags) */}
            {((message.reactions && message.reactions.length > 0)) && onAddReaction && onRemoveReaction && (
                <div className={cn(
                    "mt-1.5 px-1",
                    isMe ? "flex justify-end" : "flex justify-start"
                )}>
                    <MessageReactions
                        message={message}
                        currentUserId={currentUserId || ''}
                        onAddReaction={onAddReaction!}
                        onRemoveReaction={onRemoveReaction!}
                        showPicker={false}
                        onClosePicker={() => { }}
                        isFloating={false}
                    />
                </div>
            )}
        </div>
    );

    return (
        <div className={cn(
            "flex gap-2 mb-2 group/msg px-4",
            isMe ? "flex-row-reverse" : "flex-row"
        )}>
            {showAvatar && !isMe ? (
                <Avatar className="h-8 w-8 shrink-0 mt-auto mb-1 border border-border/30">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-[10px] bg-primary/5 text-primary">
                        {message.sender_id.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
            ) : (
                <div className="w-8 shrink-0" />
            )}

            {bubbleContent}
        </div>
    );
}
