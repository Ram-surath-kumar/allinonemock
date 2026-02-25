import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Search, Bell, Lock, UserPlus, LogOut, Trash2, Edit2, Check } from "lucide-react";
import { api } from "@/services/api";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface GroupInfoSidebarProps {
    groupId: string;
    onClose: () => void;
    currentUserId: string;
    onAddMember: () => void;
    onLeaveGroup?: () => void;
    isMobile?: boolean;
}

export function GroupInfoSidebar({ groupId, onClose, currentUserId, onAddMember, onLeaveGroup, isMobile }: GroupInfoSidebarProps) {
    const [group, setGroup] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [members, setMembers] = useState<any[]>([]);
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [desc, setDesc] = useState("");
    const [isLeaving, setIsLeaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchGroup = async () => {
            const cleanId = groupId.replace('group-', '');
            try {
                setIsLoading(true);
                setError(null);
                const res = await api.getGroupDetails(cleanId);
                if (res.data) {
                    setGroup(res.data);
                    setDesc(res.data.description || "");

                    // If backend returns group_members with nested users, use them
                    if (res.data.group_members && Array.isArray(res.data.group_members)) {
                        const mappedMembers = res.data.group_members
                            .filter((gm: any) => gm && gm.user_id) // Ensure gm exists
                            .map((gm: any) => ({
                                id: gm.user_id,
                                name: gm.users?.name || 'Unknown',
                                avatar: gm.users?.avatar,
                                email: gm.users?.email || '',
                                role: gm.users?.role
                            }));
                        setMembers(mappedMembers);
                    } else if (res.data.members) {
                        // Fallback: Fetch full user details for members if only IDs provided
                        const memberPromises = (res.data.members || []).map((id: string) =>
                            api.getUserById(id).then(r => r.data || { id, name: 'Unknown', role: 'member' })
                        );
                        const memberData = await Promise.all(memberPromises);
                        setMembers(memberData.filter(Boolean));
                    }
                } else {
                    setGroup(null);
                    setError(res.error || "Group not found");
                }
            } catch (error: any) {
                console.error("Failed to load group info", error);
                setError(error.message || "Failed to load group details");
                toast.error("Failed to load group details");
            } finally {
                setIsLoading(false);
            }
        };
        fetchGroup();
    }, [groupId]);

    const handleSaveDescription = async () => {
        const cleanId = groupId.replace('group-', '');
        try {
            await api.updateGroupDescription(cleanId, desc);
            toast.success("Description updated");
            setIsEditingDesc(false);
            setGroup({ ...group, description: desc });
        } catch (error) {
            toast.error("Failed to update description");
        }
    };

    const handleLeaveGroup = async () => {
        if (!confirm("Are you sure you want to leave this group?")) return;

        setIsLeaving(true);
        const cleanId = groupId.replace('group-', '');
        try {
            await api.leaveGroup(cleanId, currentUserId);
            toast.success("You have left the group");
            onLeaveGroup?.();
        } catch (error) {
            toast.error("Failed to leave group");
        } finally {
            setIsLeaving(false);
        }
    };

    if (!group && !isLoading) {
        return (
            <div className="w-80 h-full border-l border-border bg-background flex flex-col items-center justify-center p-8 text-center">
                <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-4 left-4">
                    <X className="h-5 w-5" />
                </Button>
                <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-4">
                    <Trash2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">Failed to load group details</p>
                    {error && <p className="text-[10px] mt-1 opacity-70 break-all">{error}</p>}
                </div>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className={cn(
            "w-80 h-full border-l border-border bg-background flex flex-col animate-in slide-in-from-right duration-300 z-50",
            isMobile && "fixed inset-y-0 right-0 shadow-2xl"
        )}>
            {isMobile && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[-1] animate-in fade-in duration-300"
                    onClick={onClose}
                />
            )}
            {/* Header */}
            <div className="h-16 flex items-center px-4 border-b border-border bg-muted/30 shrink-0">
                <Button variant="ghost" size="icon" onClick={onClose} className="mr-2">
                    <X className="h-5 w-5 text-muted-foreground" />
                </Button>
                <span className="font-semibold text-sm">Group Info</span>
            </div>

            <ScrollArea className="flex-1">
                {isLoading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading...</div>
                ) : (
                    <div className="pb-8">
                        {/* Group Profile */}
                        <div className="flex flex-col items-center py-8 px-4 bg-background">
                            <Avatar className="h-32 w-32 mb-4 shadow-sm border-4 border-muted/20">
                                <AvatarImage src={group?.icon} />
                                <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                                    {group?.name?.substring(0, 2).toUpperCase() || 'GR'}
                                </AvatarFallback>
                            </Avatar>
                            <h2 className="text-xl font-semibold text-center mb-1">{group?.name || 'Group'}</h2>
                            <p className="text-sm text-muted-foreground">
                                Group · {members.length} members
                            </p>
                        </div>

                        <div className="h-2 bg-muted/30 border-y border-border/50" />

                        {/* Description */}
                        <div className="p-4 bg-muted/10">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</h3>
                                {isEditingDesc ? (
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-green-500 hover:text-green-600 hover:bg-green-100"
                                            onClick={handleSaveDescription}
                                        >
                                            <Check className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-100"
                                            onClick={() => {
                                                setDesc(group.description || "");
                                                setIsEditingDesc(false);
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                        onClick={() => setIsEditingDesc(true)}
                                    >
                                        <Edit2 className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>

                            {isEditingDesc ? (
                                <Textarea
                                    value={desc}
                                    onChange={(e) => setDesc(e.target.value)}
                                    className="min-h-[80px] text-sm bg-background"
                                    placeholder="Add group description..."
                                />
                            ) : (
                                <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                                    {group.description || <span className="text-muted-foreground italic">No description provided.</span>}
                                </p>
                            )}

                            <div className="mt-3 text-xs text-muted-foreground">
                                Created by Admin on {group?.created_at ? format(new Date(group.created_at), 'dd/MM/yyyy') : 'N/A'}
                            </div>
                        </div>

                        <div className="h-2 bg-muted/30 border-y border-border/50" />

                        {/* Actions */}
                        <div className="p-2">
                            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
                                <Bell className="h-5 w-5 mr-3" />
                                <div className="flex flex-col items-start text-sm">
                                    <span>Calculated Notifications</span>
                                </div>
                            </Button>
                            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
                                <Lock className="h-5 w-5 mr-3" />
                                <div className="flex flex-col items-start text-sm">
                                    <span>Encryption</span>
                                    <span className="text-xs font-normal opacity-70">Messages are end-to-end encrypted.</span>
                                </div>
                            </Button>
                        </div>

                        <div className="h-2 bg-muted/30 border-y border-border/50" />

                        {/* Participants */}
                        <div className="p-4 pb-0">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{members.length} Members</h3>
                                <Search className="h-4 w-4 text-muted-foreground cursor-pointer" />
                            </div>

                            <div
                                className="flex items-center gap-3 p-2 -mx-2 hover:bg-muted/50 rounded-lg cursor-pointer text-primary mb-2"
                                onClick={onAddMember}
                            >
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <UserPlus className="h-5 w-5" />
                                </div>
                                <span className="text-sm font-medium">Add member</span>
                            </div>

                            <div className="space-y-1">
                                {members.filter(m => m && m.id).map(member => (
                                    <div key={member.id} className="flex items-center gap-3 p-2 -mx-2 hover:bg-muted/50 rounded-lg cursor-pointer group">
                                        <Avatar className="h-10 w-10 border border-border/30">
                                            <AvatarImage src={member.profile_picture || member.avatar} />
                                            <AvatarFallback className="text-xs">
                                                {member.name?.substring(0, 2).toUpperCase() || '??'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium truncate">
                                                    {member.id === currentUserId ? "You" : member.name}
                                                    {member.role && <span className="text-xs text-muted-foreground ml-1 capitalize">({member.role.replace('_', ' ')})</span>}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">{member.email || "No status"}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="h-2 bg-muted/30 border-y border-border/50 mt-4" />

                        <div className="p-2 space-y-1">
                            <Button
                                variant="outline"
                                className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 border-red-200 dark:border-red-900/50"
                                onClick={handleLeaveGroup}
                                disabled={isLeaving}
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                {isLeaving ? "Leaving..." : "Exit Group"}
                            </Button>
                            <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
                                <Trash2 className="h-5 w-5 mr-3" />
                                Report Group
                            </Button>
                        </div>
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
