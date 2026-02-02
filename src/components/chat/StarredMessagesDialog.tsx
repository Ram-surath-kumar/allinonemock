import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Message } from "./ChatWindow";
import { FileText, Image as ImageIcon } from "lucide-react";

interface StarredMessagesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    messages: Message[];
    currentUserId: string;
}

export function StarredMessagesDialog({ open, onOpenChange, messages, currentUserId }: StarredMessagesDialogProps) {
    const starredMessages = messages.filter(m => m.starred);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Starred Messages</DialogTitle>
                </DialogHeader>
                <div className="h-[400px]">
                    {starredMessages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                            No starred messages
                        </div>
                    ) : (
                        <ScrollArea className="h-full pr-4">
                            <div className="space-y-4">
                                {starredMessages.map((msg) => (
                                    <div key={msg.id} className="bg-muted/30 p-3 rounded-lg border border-border">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-semibold text-primary">
                                                {msg.sender_id === currentUserId ? "You" : "Sender"}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {format(new Date(msg.created_at), "MMM d, h:mm a")}
                                            </span>
                                        </div>
                                        <div className="text-sm">
                                            {msg.type === "image" ? (
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <ImageIcon className="h-4 w-4" />
                                                    <span>Photo</span>
                                                </div>
                                            ) : msg.type === "file" ? (
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <FileText className="h-4 w-4" />
                                                    <span>{msg.file_name || "File"}</span>
                                                </div>
                                            ) : (
                                                <p>{msg.content}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
