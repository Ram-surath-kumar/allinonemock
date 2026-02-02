import { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Reply,
    Copy,
    Forward,
    Pin,
    Star,
    Trash2,
    Info,
    Smile,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    sender_id: string;
    content: string;
    type: "text" | "image" | "file";
    created_at: string;
    read?: boolean;
    pinned?: boolean;
    starred?: boolean;
    reactions?: Array<{ emoji: string; user_id: string }>;
}

interface MessageContextMenuProps {
    message: Message;
    isMe: boolean;
    onReply: (message: Message) => void;
    onCopy: (content: string) => void;
    onReact: (message: Message) => void;
    onForward: (message: Message) => void;
    onPin: (message: Message) => void;
    onStar: (message: Message) => void;
    onDelete: (message: Message, deleteForEveryone: boolean) => void;
    onInfo: (message: Message) => void;
    children: React.ReactNode;
}

export function MessageContextMenu({
    message,
    isMe,
    onReply,
    onCopy,
    onReact,
    onForward,
    onPin,
    onStar,
    onDelete,
    onInfo,
    children,
}: MessageContextMenuProps) {
    const [showDeleteOptions, setShowDeleteOptions] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        onCopy(message.content);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {children}
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="start"
                className="w-56 bg-popover/95 backdrop-blur-sm border-border/50"
            >
                <DropdownMenuItem onClick={() => onInfo(message)} className="gap-2 cursor-pointer">
                    <Info className="h-4 w-4" />
                    <span>Message info</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => onReply(message)} className="gap-2 cursor-pointer">
                    <Reply className="h-4 w-4" />
                    <span>Reply</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleCopy} className="gap-2 cursor-pointer">
                    <Copy className="h-4 w-4" />
                    <span>Copy</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => onReact(message)} className="gap-2 cursor-pointer">
                    <Smile className="h-4 w-4" />
                    <span>React</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => onForward(message)} className="gap-2 cursor-pointer">
                    <Forward className="h-4 w-4" />
                    <span>Forward</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => onPin(message)} className="gap-2 cursor-pointer">
                    <Pin className="h-4 w-4" />
                    <span>{message.pinned ? "Unpin" : "Pin"}</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => onStar(message)} className="gap-2 cursor-pointer">
                    <Star className={cn("h-4 w-4", message.starred && "fill-yellow-500 text-yellow-500")} />
                    <span>{message.starred ? "Unstar" : "Star"}</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {isMe ? (
                    <>
                        <DropdownMenuItem
                            onClick={() => onDelete(message, false)}
                            className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                        >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete for me</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => onDelete(message, true)}
                            className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                        >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete for everyone</span>
                        </DropdownMenuItem>
                    </>
                ) : (
                    <DropdownMenuItem
                        onClick={() => onDelete(message, false)}
                        className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                    >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
