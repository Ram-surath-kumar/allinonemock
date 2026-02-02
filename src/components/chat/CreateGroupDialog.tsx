import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search, Users, X, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";
import { toast } from "sonner";

interface User {
    id: string;
    name: string;
    avatar?: string;
    email?: string;
}

interface CreateGroupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onGroupCreated: () => void;
    currentUserId: string;
}

export function CreateGroupDialog({
    open,
    onOpenChange,
    onGroupCreated,
    currentUserId
}: CreateGroupDialogProps) {
    const [step, setStep] = useState<1 | 2>(1); // 1: Select Members, 2: Group Info
    const [searchQuery, setSearchQuery] = useState("");
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [groupName, setGroupName] = useState("");

    useEffect(() => {
        if (open) {
            setStep(1);
            setSearchQuery("");
            setSelectedUsers([]);
            setGroupName("");
            fetchUsers();
        }
    }, [open]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.getUsers();
            if (res.data) {
                // Filter out current user
                const availableUsers = res.data.filter((u: any) => u.id !== currentUserId);
                setUsers(availableUsers.map((u: any) => ({
                    id: u.id,
                    name: u.name,
                    avatar: u.profile_picture,
                    email: u.email
                })));
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
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

    const handleCreate = async () => {
        if (!groupName.trim() || selectedUsers.length === 0) return;
        setCreating(true);
        try {
            const res = await api.createGroup({
                name: groupName,
                members: [currentUserId, ...selectedUsers],
                created_by: currentUserId
            });
            if (res.error) throw new Error(res.error);
            toast.success("Group created successfully");
            onGroupCreated();
            onOpenChange(false);
        } catch (error) {
            toast.error("Failed to create group");
            console.error(error);
        } finally {
            setCreating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] flex flex-col max-h-[85vh] p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>{step === 1 ? "Add Group Members" : "New Group"}</DialogTitle>
                </DialogHeader>

                {step === 1 ? (
                    <div className="flex-1 overflow-hidden flex flex-col">
                        <div className="px-6 py-2 border-b">
                            <div className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2">
                                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                                <input
                                    className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
                                    placeholder="Search people..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2">
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
                                                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50",
                                                    isSelected && "bg-primary/5"
                                                )}
                                                onClick={() => toggleUser(user.id)}
                                            >
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={() => toggleUser(user.id)}
                                                    className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                                />
                                                <Avatar className="h-10 w-10 border border-border/50">
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

                        <div className="p-4 border-t flex justify-between items-center bg-muted/10">
                            <span className="text-sm text-muted-foreground">
                                {selectedUsers.length} selected
                            </span>
                            <Button
                                onClick={() => setStep(2)}
                                disabled={selectedUsers.length === 0}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 space-y-6">
                        <div className="flex justify-center">
                            <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors border-2 border-dashed border-border">
                                <Camera className="h-8 w-8 text-muted-foreground" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="groupName">Group Subject</Label>
                            <Input
                                id="groupName"
                                placeholder="Type group subject here..."
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                            />
                        </div>

                        <div className="flex justify-between items-center pt-4">
                            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                            <Button onClick={handleCreate} disabled={!groupName.trim() || creating}>
                                {creating ? "Creating..." : "Create Group"}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
