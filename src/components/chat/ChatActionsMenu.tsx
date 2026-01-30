import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Trash2, BellOff, Bell, Eraser, Info } from "lucide-react";

interface ChatActionsMenuProps {
    isGroup: boolean;
    isMuted: boolean;
    onMute: () => void;
    onClear: () => void;
    onDelete: () => void;
    onViewInfo?: () => void;
}

export function ChatActionsMenu({
    isGroup,
    isMuted,
    onMute,
    onClear,
    onDelete,
    onViewInfo
}: ChatActionsMenuProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {isGroup && (
                    <>
                        <DropdownMenuItem onClick={onViewInfo}>
                            <Info className="h-4 w-4 mr-2" />
                            Group Info
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                    </>
                )}
                <DropdownMenuItem onClick={onMute}>
                    {isMuted ? <Bell className="h-4 w-4 mr-2" /> : <BellOff className="h-4 w-4 mr-2" />}
                    {isMuted ? "Unmute Notifications" : "Mute Notifications"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onClear}>
                    <Eraser className="h-4 w-4 mr-2" />
                    Clear History
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isGroup ? "Leave Group" : "Delete Conversation"}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
