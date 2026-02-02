import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users, UserPlus, Check } from "lucide-react";
import { api } from "@/services/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface User {
    id: string;
    name: string;
    avatar?: string;
    email?: string;
}

interface NewChatDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    users: User[];
    currentUser: { id: string; name: string };
    onStartChat: (user: User) => void;
    onGroupCreated: () => void;
}

export function NewChatDialog({
    open,
    onOpenChange,
    users,
    currentUser,
    onStartChat,
    onGroupCreated
}: NewChatDialogProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [isGroup, setIsGroup] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Reset state when dialog opens/closes
    useEffect(() => {
        if (open) {
            setSearchQuery("");
            setSelectedUsers([]);
            setIsGroup(false);
            setGroupName("");
        }
    }, [open]);

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleUser = (userId: string) => {
        setSelectedUsers(prev => {
            if (prev.includes(userId)) {
                return prev.filter(id => id !== userId);
            } else {
                return [...prev, userId];
            }
        });
    };

    const handleCreate = async () => {
        if (selectedUsers.length === 0) return;

        if (selectedUsers.length === 1 && !isGroup) {
            // Direct message
            const user = users.find(u => u.id === selectedUsers[0]);
            if (user) {
                onStartChat(user);
                onOpenChange(false);
            }
            return;
        }

        // Group creation
        if (!groupName.trim()) {
            toast.error("Please enter a group name");
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.createGroup({
                name: groupName,
                members: selectedUsers,
                created_by: currentUser.id
            });

            if (response.error) throw new Error(response.error);

            toast.success("Group created successfully");
            onGroupCreated();
            onOpenChange(false);
        } catch (error) {
            toast.error("Failed to create group");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] overflow-hidden flex flex-col max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle>New Conversation</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col gap-4 py-2">
                    {/* Group Toggle / Name Input */}
                    {(selectedUsers.length > 1 || isGroup) && (
                        <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-200">
                            <Label htmlFor="group-name">Group Name</Label>
                            <Input
                                id="group-name"
                                placeholder="Enter group name..."
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                            />
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <Label className="text-sm text-muted-foreground">
                            Select Users ({selectedUsers.length})
                        </Label>
                        {selectedUsers.length === 1 && !isGroup && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => setIsGroup(true)}
                            >
                                Create Group Instead
                            </Button>
                        )}
                    </div>

                    <div className="border rounded-md flex-1 overflow-hidden flex flex-col">
                        <div className="p-2 border-b flex items-center gap-2">
                            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                            <input
                                className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
                                placeholder="Search people..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto p-1">
                            {filteredUsers.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    No users found
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {filteredUsers.map(user => {
                                        const isSelected = selectedUsers.includes(user.id);
                                        return (
                                            <div
                                                key={user.id}
                                                className={cn(
                                                    "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors hover:bg-muted",
                                                    isSelected && "bg-primary/10"
                                                )}
                                                onClick={() => toggleUser(user.id)}
                                            >
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={() => toggleUser(user.id)}
                                                    className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                                />
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={user.avatar} />
                                                    <AvatarFallback className="text-xs">
                                                        {user.name.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={selectedUsers.length === 0 || isLoading}>
                        {isLoading ? "Creating..." :
                            selectedUsers.length > 1 || isGroup ? "Create Group" : "Start Chat"
                        }
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
