import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SmilePlus } from "lucide-react";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    sender_id: string;
    reactions?: Array<{ emoji: string; user_id: string; user_name?: string }>;
}

interface MessageReactionsProps {
    message: Message;
    currentUserId: string;
    onAddReaction: (messageId: string, emoji: string) => void;
    onRemoveReaction: (messageId: string, emoji: string) => void;
    showPicker?: boolean;
    onClosePicker?: () => void;
    isFloating?: boolean;
}

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "🙏", "🔥"];

export function MessageReactions({
    message,
    currentUserId,
    onAddReaction,
    onRemoveReaction,
    showPicker = false,
    onClosePicker,
    isFloating = false,
}: MessageReactionsProps) {
    const [showFullPicker, setShowFullPicker] = useState(false);
    const reactions = message.reactions || [];
    const isMe = currentUserId === message.sender_id;

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

    // FLOATING BAR MODE (WhatsApp Style)
    if (isFloating) {
        return (
            <div
                className="flex flex-col gap-1.5 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {!showFullPicker ? (
                    <div className="bg-popover/90 border border-border/50 rounded-full shadow-2xl px-2 py-1.5 flex items-center gap-1 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {QUICK_REACTIONS.map((emoji) => {
                            const hasReacted = reactions.some(
                                (r) => r.emoji === emoji && r.user_id === currentUserId
                            );
                            return (
                                <button
                                    key={emoji}
                                    className={cn(
                                        "h-9 w-9 p-0 text-2xl hover:scale-150 active:scale-90 transition-all duration-200 rounded-full flex items-center justify-center",
                                        hasReacted
                                            ? "bg-primary/10 scale-110"
                                            : "hover:bg-muted/50"
                                    )}
                                    onClick={() => handleQuickReaction(emoji)}
                                >
                                    {emoji}
                                </button>
                            );
                        })}
                        <div className="w-px h-6 bg-border/50 mx-1" />
                        <button
                            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all duration-200 hover:rotate-12"
                            onClick={() => setShowFullPicker(true)}
                            title="Add reaction"
                        >
                            <SmilePlus className="h-5 w-5" />
                        </button>
                    </div>
                ) : (
                    <div className="shadow-2xl rounded-2xl border border-border/50 bg-background animate-in fade-in zoom-in-95 duration-300 w-[350px] emoji-picker-wrapper">
                        <style>{`
                            .emoji-picker-wrapper button {
                                min-height: 0 !important;
                            }
                        `}</style>
                        <EmojiPicker
                            onEmojiClick={handleEmojiClick}
                            width={350}
                            height={450}
                            previewConfig={{ showPreview: false }}
                            skinTonesDisabled={false}
                            searchDisabled={false}
                            theme={Theme.AUTO}
                            style={{
                                backgroundColor: "transparent",
                                borderColor: "transparent",
                                "--epr-bg-color": "var(--background)",
                                "--epr-category-label-bg-color": "var(--background)",
                                "--epr-text-color": "var(--foreground)",
                                border: "none"
                            } as any}
                        />
                    </div>
                )}
            </div>
        );
    }

    // TAG DISPLAY MODE (Small badges below bubble)
    if (Object.keys(groupedReactions).length === 0) return null;

    return (
        <div className={cn("flex flex-wrap gap-1", isMe ? "justify-end" : "justify-start")}>
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
                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] border transition-all duration-200 hover:scale-110 active:scale-95",
                            hasReacted
                                ? "bg-primary/10 border-primary/30 text-primary shadow-sm ring-1 ring-primary/20"
                                : "bg-muted/30 border-border/30 hover:bg-muted/50"
                        )}
                    >
                        <span>{emoji}</span>
                        {count > 1 && <span className="font-bold opacity-80">{count}</span>}
                    </button>
                );
            })}
        </div>
    );
}

