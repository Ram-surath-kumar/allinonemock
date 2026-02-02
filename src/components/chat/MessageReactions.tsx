import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
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

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

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
                <div className="absolute bottom-full mb-2 left-0 z-50 bg-popover border border-border rounded-full shadow-lg px-2 py-1.5 flex items-center gap-1">
                    {QUICK_REACTIONS.map((emoji) => {
                        const hasReacted = reactions.some(
                            (r) => r.emoji === emoji && r.user_id === currentUserId
                        );
                        return (
                            <Button
                                key={emoji}
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "h-8 w-8 p-0 text-xl hover:scale-125 transition-transform",
                                    hasReacted && "bg-primary/10"
                                )}
                                onClick={() => handleQuickReaction(emoji)}
                            >
                                {emoji}
                            </Button>
                        );
                    })}
                    <div className="w-px h-6 bg-border mx-1" />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-lg"
                        onClick={() => setShowFullPicker(true)}
                    >
                        ➕
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={onClosePicker}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Full Emoji Picker */}
            {showFullPicker && (
                <div className="absolute bottom-full mb-2 left-0 z-50 shadow-xl rounded-xl">
                    <div className="fixed inset-0 z-40" onClick={() => {
                        setShowFullPicker(false);
                        onClosePicker?.();
                    }} />
                    <div className="relative z-50">
                        <EmojiPicker onEmojiClick={handleEmojiClick} width={300} height={400} />
                    </div>
                </div>
            )}

            {/* Display Existing Reactions */}
            {Object.keys(groupedReactions).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
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
                                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors",
                                    hasReacted
                                        ? "bg-primary/10 border-primary/30 text-primary"
                                        : "bg-muted/50 border-border hover:bg-muted"
                                )}
                            >
                                <span>{emoji}</span>
                                <span className="font-medium">{count}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
