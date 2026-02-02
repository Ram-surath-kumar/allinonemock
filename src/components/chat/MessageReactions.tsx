import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SmilePlus } from "lucide-react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    reactions?: Array<{ emoji: string; user_id: string; user_name?: string }>;
}

interface MessageReactionsProps {
    message: Message;
    currentUserId: string;
    onAddReaction: (messageId: string, emoji: string) => void;
    onRemoveReaction: (messageId: string, emoji: string) => void;
    showPicker?: boolean;
    onClosePicker?: () => void;
}

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "🙏"];

export function MessageReactions({
    message,
    currentUserId,
    onAddReaction,
    onRemoveReaction,
    showPicker = false,
    onClosePicker,
}: MessageReactionsProps) {
    const [showFullPicker, setShowFullPicker] = useState(showPicker);

    const reactions = message.reactions || [];

    // Group reactions by emoji
    const groupedReactions = reactions.reduce((acc, reaction) => {
        if (!acc[reaction.emoji]) {
            acc[reaction.emoji] = [];
        }
        acc[reaction.emoji].push(reaction);
        return acc;
    }, {} as Record<string, Array<{ emoji: string; user_id: string; user_name?: string }>>);

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        const emoji = emojiData.emoji;
        const userReaction = reactions.find(
            (r) => r.emoji === emoji && r.user_id === currentUserId
        );

        if (userReaction) {
            onRemoveReaction(message.id, emoji);
        } else {
            onAddReaction(message.id, emoji);
        }

        setShowFullPicker(false);
        onClosePicker?.();
    };

    const handleQuickReaction = (emoji: string) => {
        const userReaction = reactions.find(
            (r) => r.emoji === emoji && r.user_id === currentUserId
        );

        if (userReaction) {
            onRemoveReaction(message.id, emoji);
        } else {
            onAddReaction(message.id, emoji);
        }

        onClosePicker?.();
    };

    return (
        <div
            className="relative"
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
        >
            {/* Quick Reactions Bar */}
            {showPicker && !showFullPicker && (
                <div className="absolute bottom-full mb-2 left-0 z-50 bg-popover border border-border/50 rounded-xl shadow-lg px-2 py-1.5 flex items-center gap-1.5 backdrop-blur-sm">
                    {QUICK_REACTIONS.map((emoji) => {
                        const hasReacted = reactions.some(
                            (r) => r.emoji === emoji && r.user_id === currentUserId
                        );
                        return (
                            <button
                                key={emoji}
                                className={cn(
                                    "h-7 w-7 p-0 text-base hover:scale-110 active:scale-95 transition-all duration-150 rounded-lg flex items-center justify-center",
                                    hasReacted 
                                        ? "bg-primary/15 hover:bg-primary/20" 
                                        : "hover:bg-muted/80"
                                )}
                                onClick={() => handleQuickReaction(emoji)}
                                title={hasReacted ? "Remove reaction" : "Add reaction"}
                            >
                                {emoji}
                            </button>
                        );
                    })}
                    <div className="w-px h-5 bg-border/50 mx-0.5" />
                    <button
                        className="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg transition-colors flex items-center gap-1"
                        onClick={() => setShowFullPicker(true)}
                        title="More emojis"
                    >
                        <SmilePlus className="h-3.5 w-3.5" />
                        <span>More</span>
                    </button>
                </div>
            )}

            {/* Full Emoji Picker */}
            {showFullPicker && (
                <div className="absolute bottom-full mb-2 left-0 z-50 shadow-xl rounded-xl overflow-hidden">
                    <div className="fixed inset-0 z-40" onClick={() => {
                        setShowFullPicker(false);
                        onClosePicker?.();
                    }} />
                    <div className="relative z-50">
                        <EmojiPicker 
                            onEmojiClick={handleEmojiClick} 
                            width={320} 
                            height={420}
                            previewConfig={{ showPreview: false }}
                            skinTonesDisabled
                        />
                    </div>
                </div>
            )}

            {/* Display Existing Reactions */}
            {Object.keys(groupedReactions).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
                        const hasReacted = reactionList.some((r) => r.user_id === currentUserId);
                        const count = reactionList.length;
                        const names = reactionList.map((r) => r.user_name || "Someone").join(", ");

                        return (
                            <button
                                key={emoji}
                                onClick={() => handleQuickReaction(emoji)}
                                title={names}
                                className={cn(
                                    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-all duration-150 hover:scale-105 active:scale-95",
                                    hasReacted
                                        ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/15"
                                        : "bg-muted/50 border-border/50 hover:bg-muted/70 hover:border-border"
                                )}
                            >
                                <span className="text-sm">{emoji}</span>
                                <span className="font-semibold text-[11px]">{count}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
