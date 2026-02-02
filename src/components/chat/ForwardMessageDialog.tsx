import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Chat {
    id: string;
    userName: string;
    userAvatar?: string;
    type?: 'direct' | 'group';
}

interface ForwardMessageDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    message: {
        id: string;
        content: string;
        type: "text" | "image" | "file";
    };
    chats: Chat[];
    onForward: (chatIds: string[]) => void;
}

export function ForwardMessageDialog({
    open,
    onOpenChange,
    message,
    chats,
    onForward,
}: ForwardMessageDialogProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedChats, setSelectedChats] = useState<string[]>([]);

    const filteredChats = chats.filter((chat) =>
        chat.userName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleChat = (chatId: string) => {
        setSelectedChats((prev) =>
            prev.includes(chatId)
                ? prev.filter((id) => id !== chatId)
                : [...prev, chatId]
        );
    };

    const handleForward = () => {
        if (selectedChats.length > 0) {
            onForward(selectedChats);
            setSelectedChats([]);
            setSearchQuery("");
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Forward message</DialogTitle>
                    <DialogDescription>
                        Select chats to forward this message to
                    </DialogDescription>
                </DialogHeader>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search chats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Selected Count */}
                {selectedChats.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                        {selectedChats.length} chat{selectedChats.length !== 1 ? "s" : ""} selected
                    </div>
                )}

                {/* Chat List */}
                <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-2">
                        {filteredChats.map((chat) => {
                            const isSelected = selectedChats.includes(chat.id);
                            return (
                                <div
                                    key={chat.id}
                                    onClick={() => toggleChat(chat.id)}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                                        isSelected
                                            ? "bg-primary/10 border-2 border-primary"
                                            : "hover:bg-muted border-2 border-transparent"
                                    )}
                                >
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={chat.userAvatar} />
                                        <AvatarFallback>
                                            {chat.userName.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{chat.userName}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {chat.type === "group" ? "Group" : "Direct message"}
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                            <svg
                                                className="h-3 w-3 text-primary-foreground"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleForward}
                        disabled={selectedChats.length === 0}
                    >
                        Forward to {selectedChats.length || ""}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
