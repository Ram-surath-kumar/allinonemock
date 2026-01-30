import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Check, CheckCheck } from "lucide-react";
import { MessageContextMenu } from "./MessageContextMenu";
import { MessageReactions } from "./MessageReactions";

interface Message {
    id: string;
    sender_id: string;
    content: string;
    type: "text" | "image" | "file";
    created_at: string;
    read?: boolean;
    read_by?: string[]; // For groups
    reactions?: Array<{ emoji: string; user_id: string; user_name?: string }>;
    reply_to_id?: string;
    reply_to?: Message;
    pinned?: boolean;
    starred?: boolean;
    file_url?: string;
    file_name?: string;
    file_type?: string;
    file_size?: number;
}

interface ChatBubbleProps {
    message: Message;
    isMe: boolean;
    senderName?: string;
    senderAvatar?: string;
    showAvatar?: boolean;
    showName?: boolean;
    currentUserId: string;
    onReply?: (message: Message) => void;
    onCopy?: (content: string) => void;
    onReact?: (message: Message) => void;
    onForward?: (message: Message) => void;
    onPin?: (message: Message) => void;
    onStar?: (message: Message) => void;
    onDelete?: (message: Message, deleteForEveryone: boolean) => void;
    onInfo?: (message: Message) => void;
    onAddReaction?: (messageId: string, emoji: string) => void;
    onRemoveReaction?: (messageId: string, emoji: string) => void;
}

export function ChatBubble({
    message,
    isMe,
    senderName,
    senderAvatar,
    showAvatar = true,
    showName = false,
    currentUserId,
    onReply = () => { },
    onCopy = () => { },
    onReact = () => { },
    onForward = () => { },
    onPin = () => { },
    onStar = () => { },
    onDelete = () => { },
    onInfo = () => { },
    onAddReaction = () => { },
    onRemoveReaction = () => { },
}: ChatBubbleProps) {
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const time = format(new Date(message.created_at), "h:mm a");

    return (
        <div className={cn("flex gap-2 mb-4 group", isMe ? "justify-end" : "justify-start")}>
            {/* Avatar (Left for others) */}
            {!isMe && (
                <Avatar className={cn("h-8 w-8 mt-1", !showAvatar && "opacity-0")}>
                    <AvatarImage src={senderAvatar} />
                    <AvatarFallback className="text-[10px]">
                        {senderName?.substring(0, 2).toUpperCase() || "??"}
                    </AvatarFallback>
                </Avatar>
            )}

            <div className={cn("max-w-[70%] flex flex-col", isMe ? "items-end" : "items-start")}>
                {/* Sender Name (for groups) */}
                {!isMe && showName && (
                    <span className="text-[10px] text-muted-foreground ml-1 mb-1">{senderName}</span>
                )}

                {/* Message Bubble */}
                <MessageContextMenu
                    message={message}
                    isMe={isMe}
                    onReply={onReply}
                    onCopy={onCopy}
                    onReact={() => setShowReactionPicker(true)}
                    onForward={onForward}
                    onPin={onPin}
                    onStar={onStar}
                    onDelete={onDelete}
                    onInfo={onInfo}
                >
                    <div
                        className={cn(
                            "px-3 py-2 rounded-2xl text-sm relative shadow-sm cursor-pointer hover:shadow-md transition-shadow",
                            isMe
                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                : "bg-muted text-foreground rounded-tl-none"
                        )}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        {/* Reply Preview */}
                        {message.reply_to && (
                            <div className={cn(
                                "mb-2 pb-2 border-l-2 pl-2 text-xs opacity-70",
                                isMe ? "border-primary-foreground/30" : "border-primary/30"
                            )}>
                                <div className="font-medium">{message.reply_to.sender_id === currentUserId ? "You" : senderName}</div>
                                <div className="truncate flex items-center gap-1">
                                    {message.reply_to.type === "image" ? (
                                        <>
                                            <span className="text-xs">📷</span>
                                            <span>Photo</span>
                                        </>
                                    ) : message.reply_to.type === "file" ? (
                                        <>
                                            <span className="text-xs">📎</span>
                                            <span>{message.reply_to.file_name || "File"}</span>
                                        </>
                                    ) : (
                                        message.reply_to.content
                                    )}
                                </div>
                            </div>
                        )}

                        {message.type === 'image' ? (
                            <div className="italic text-xs">[Image Attachment]</div>
                        ) : message.type === 'file' ? (
                            <div className="flex items-center gap-2 p-2 bg-background/10 rounded">
                                <div className="text-xs">
                                    <div className="font-medium">{message.file_name}</div>
                                    <div className="opacity-70">{message.file_size ? `${(message.file_size / 1024).toFixed(1)} KB` : ''}</div>
                                </div>
                            </div>
                        ) : (
                            <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                        )}
                    </div>
                </MessageContextMenu>

                {/* Reactions */}
                <MessageReactions
                    message={message}
                    currentUserId={currentUserId}
                    onAddReaction={onAddReaction}
                    onRemoveReaction={onRemoveReaction}
                    showPicker={showReactionPicker}
                    onClosePicker={() => setShowReactionPicker(false)}
                />

                {/* Timestamp & Status */}
                <div className={cn("flex items-center gap-1 mt-1 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity", isMe ? "mr-1" : "ml-1")}>
                    <span>{time}</span>
                    {isMe && (
                        <span>
                            {message.read || (message.read_by && message.read_by.length > 0) ? (
                                <CheckCheck className="h-3 w-3 text-blue-500" />
                            ) : (
                                <Check className="h-3 w-3" />
                            )}
                        </span>
                    )}
                </div>
            </div>

            {/* Avatar (Right placeholder? No, strictly left for others) */}
        </div>
    );
}
