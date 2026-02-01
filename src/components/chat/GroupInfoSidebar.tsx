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
}

export function GroupInfoSidebar({ groupId, onClose, currentUserId, onAddMember }: GroupInfoSidebarProps) {
    const [group, setGroup] = useState<any>({
        name: "Loading...",
        members: [],
        created_at: new Date().toISOString()
    });
    const [loading, setLoading] = useState(false);
    const [members, setMembers] = useState<any[]>([]);
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [desc, setDesc] = useState("");

    useEffect(() => {
        const fetchGroup = async () => {
            try {
                setLoading(true);
                const res = await api.getGroupDetails(groupId);
                if (res.data) {
                    setGroup(res.data);
                    setDesc(res.data.description || "");
                    // Fetch full user details for members
                    const memberPromises = (res.data.members || []).map((id: string) =>
                        api.getUserById(id).then(r => r.data || { id, name: 'Unknown', role: 'member' })
                    );
                    const memberData = await Promise.all(memberPromises);
                    setMembers(memberData);
                }
            } catch (error) {
                console.error("Failed to load group info", error);
            } finally {
                setLoading(false);
            }
        };
        fetchGroup();
    }, [groupId]);

    const handleSaveDescription = async () => {
        try {
            await api.updateGroupDescription(groupId, desc);
            toast.success("Description updated");
            setIsEditingDesc(false);
            setGroup({ ...group, description: desc });
        } catch (error) {
            toast.error("Failed to update description");
        }
    };

    if (!group && !loading) return null;

    return (
        <div className="w-80 h-full border-l border-border bg-background flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="h-16 flex items-center px-4 border-b border-border bg-muted/30 shrink-0">
                <Button variant="ghost" size="icon" onClick={onClose} className="mr-2">
                    <X className="h-5 w-5 text-muted-foreground" />
                </Button>
                <span className="font-semibold text-sm">Group Info</span>
            </div>

            <ScrollArea className="flex-1">
                {loading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading...</div>
                ) : (
                    <div className="pb-8">
                        {/* Group Profile */}
                        <div className="flex flex-col items-center py-8 px-4 bg-background">
                            <Avatar className="h-32 w-32 mb-4 shadow-sm border-4 border-muted/20">
                                <AvatarImage src={group.icon} />
                                <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                                    {group.name?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <h2 className="text-xl font-semibold text-center mb-1">{group.name}</h2>
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
                                Created by Admin on {format(new Date(group.created_at), 'dd/MM/yyyy')}
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
                                {members.map(member => (
                                    <div key={member.id} className="flex items-center gap-3 p-2 -mx-2 hover:bg-muted/50 rounded-lg cursor-pointer group">
                                        <Avatar className="h-10 w-10 border border-border/30">
                                            <AvatarImage src={member.profile_picture || member.avatar} />
                                            <AvatarFallback className="text-xs">
                                                {member.name?.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium truncate">
                                                    {member.id === currentUserId ? "You" : member.name}
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
                            <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
                                <LogOut className="h-5 w-5 mr-3" />
                                Exit Group
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
