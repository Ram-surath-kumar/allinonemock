import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Check, CheckCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    content: string;
    created_at: string;
    read_by?: string[];
}

interface MessageInfoDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    message: Message;
    isGroup: boolean;
    groupMembers?: Array<{ id: string; name: string; avatar?: string }>;
}

export function MessageInfoDialog({
    open,
    onOpenChange,
    message,
    isGroup,
    groupMembers = [],
}: MessageInfoDialogProps) {
    const readBy = message.read_by || [];
    const readMembers = groupMembers.filter((m) => readBy.includes(m.id));
    const unreadMembers = groupMembers.filter((m) => !readBy.includes(m.id));

    // Safe date formatting helper
    const formatDate = (dateString: string, formatStr: string) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return "N/A";
            }
            return format(date, formatStr);
        } catch (error) {
            return "N/A";
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Message info</DialogTitle>
                    <DialogDescription>
                        Delivery and read status
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Message Preview */}
                    <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm line-clamp-3">{message.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(message.created_at, "PPp")}
                        </p>
                    </div>

                    {/* Status */}
                    {isGroup ? (
                        <ScrollArea className="max-h-[300px]">
                            {/* Read By */}
                            {readMembers.length > 0 && (
                                <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                                        <CheckCheck className="h-4 w-4 text-blue-500" />
                                        <span>Read by {readMembers.length}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {readMembers.map((member) => (
                                            <div key={member.id} className="flex items-center gap-2 text-sm">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                                                    {member.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span>{member.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Unread */}
                            {unreadMembers.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
                                        <Check className="h-4 w-4" />
                                        <span>Delivered to {unreadMembers.length}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {unreadMembers.map((member) => (
                                            <div key={member.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs">
                                                    {member.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span>{member.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </ScrollArea>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Sent</span>
                                <span>{formatDate(message.created_at, "p")}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Delivered</span>
                                <span>{formatDate(message.created_at, "p")}</span>
                            </div>
                            {readBy.length > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Read</span>
                                    <span>{formatDate(message.created_at, "p")}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <Button onClick={() => onOpenChange(false)} className="w-full">
                    Close
                </Button>
            </DialogContent>
        </Dialog>
    );
}

