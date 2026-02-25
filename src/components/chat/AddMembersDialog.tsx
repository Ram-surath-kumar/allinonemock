import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";
import { toast } from "sonner";

interface User {
    id: string;
    name: string;
    avatar?: string;
    email?: string;
    role?: string;
}

interface AddMembersDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groupId: string;
    currentMemberIds: string[];
    onMembersAdded: () => void;
}

export function AddMembersDialog({
    open,
    onOpenChange,
    groupId,
    currentMemberIds,
    onMembersAdded
}: AddMembersDialogProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        if (open) {
            setSearchQuery("");
            setSelectedUsers([]);
            fetchUsers();
        }
    }, [open]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // 1. Fetch group details to get actual current members
            const groupRes = await api.getGroupDetails(groupId);
            let membersList = currentMemberIds;

            if (groupRes.data) {
                if (groupRes.data.group_members) {
                    membersList = groupRes.data.group_members.map((m: any) => m.user_id);
                } else if (groupRes.data.members) {
                    membersList = groupRes.data.members;
                }
            }

            // 2. Fetch all users
            const res = await api.getUsers();
            if (res.data) {
                // Filter out users who are already members
                const availableUsers = res.data.filter((u: any) => !membersList.includes(u.id));
                setUsers(availableUsers.map((u: any) => ({
                    id: u.id,
                    name: u.name,
                    avatar: u.profile_picture || u.avatar,
                    email: u.email,
                    role: u.role
                })));
            }
        } catch (error) {
            console.error("Failed to fetch users or group info", error);
            // Fallback to basic user fetch if group details fail
            try {
                const res = await api.getUsers();
                if (res.data) {
                    setUsers(res.data.map((u: any) => ({
                        id: u.id,
                        name: u.name,
                        avatar: u.profile_picture || u.avatar,
                        email: u.email,
                        role: u.role
                    })));
                }
            } catch (e) { }
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleUser = (userId: string) => {
        setSelectedUsers(prev => {
            if (prev.includes(userId)) return prev.filter(id => id !== userId);
            return [...prev, userId];
        });
    };

    const handleAdd = async () => {
        if (selectedUsers.length === 0) return;
        setAdding(true);
        try {
            const res = await api.addGroupMembers(groupId, selectedUsers);
            if (res.error) throw new Error(res.error);
            toast.success("Members added successfully");
            onMembersAdded();
            onOpenChange(false);
        } catch (error) {
            toast.error("Failed to add members");
            console.error(error);
        } finally {
            setAdding(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] flex flex-col max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle>Add Members</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col gap-4 py-2">
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
                            {loading ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">Loading users...</div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">No users found</div>
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
                                                    <p className="text-sm font-medium truncate">
                                                        {user.name}
                                                        {user.role && <span className="text-xs text-muted-foreground ml-1 capitalize">({user.role.replace('_', ' ')})</span>}
                                                    </p>
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
                    <Button onClick={handleAdd} disabled={selectedUsers.length === 0 || adding}>
                        {adding ? "Adding..." : "Add Selected"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
