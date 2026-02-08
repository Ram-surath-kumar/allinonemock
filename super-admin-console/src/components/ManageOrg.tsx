import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface Organization {
    id: string;
    org_name: string;
    org_code: string;
    org_id: string;
    org_logo?: string;
    allowed_tabs?: string[];
    created_at: string;
}

export function ManageOrg() {
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTabConfigOpen, setIsTabConfigOpen] = useState(false);
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        org_name: "",
        org_code: "",
        org_id: "",
        org_logo: "",
    });

    // Available tabs that can be configured
    const AVAILABLE_TABS = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'chat', label: 'Chat' },
        { id: 'users', label: 'User Management' },
        { id: 'students', label: 'Students' },
        { id: 'attendance', label: 'Attendance' },
        { id: 'academic_gov', label: 'Academic Governance' },
        { id: 'mis_reports', label: 'MIS Reports' },
        { id: 'finance', label: 'Finance' },
        { id: 'facilities', label: 'Facilities' },
        { id: 'hostel', label: 'Hostel' },
        { id: 'library', label: 'Library' },
        { id: 'transport', label: 'Transportation' },
        { id: 'exam', label: 'Examinations' },
        { id: 'tools', label: 'Tools' },
        { id: 'settings', label: 'Settings' },
    ];

    const fetchOrgs = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("organizations")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setOrgs(data || []);
        } catch (error) {
            console.error("Error fetching organizations:", error);
            toast({
                title: "Error",
                description: "Failed to load organizations",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrgs();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Basic validation
            if (!formData.org_name || !formData.org_code || !formData.org_id) {
                throw new Error("Please fill in all required fields");
            }

            const { error } = await supabase.from("organizations").insert([
                {
                    org_name: formData.org_name,
                    org_code: formData.org_code,
                    org_id: formData.org_id,
                    org_logo: formData.org_logo || null,
                },
            ]);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Organization created successfully",
            });

            setIsDialogOpen(false);
            setFormData({ org_name: "", org_code: "", org_id: "", org_logo: "" });
            fetchOrgs();
        } catch (error: any) {
            console.error("Error creating organization:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to create organization",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
            return;
        }

        try {
            // Note: This operation might fail if there are foreign key constraints (users, etc.)
            // Ideally we should delete/archive cascading data or soft delete. 
            // For this admin tool, we'll try a direct delete and catch FK errors.
            const { error } = await supabase.from("organizations").delete().eq("id", id);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Organization deleted successfully",
            });
            fetchOrgs();
        } catch (error: any) {
            console.error("Error deleting organization:", error);
            toast({
                title: "Deletion Failed",
                description: "Could not delete organization. It may have associated users or data.",
                variant: "destructive",
            });
        }
    };

    const handleConfigureTabs = (org: Organization) => {
        setSelectedOrg(org);
        setIsTabConfigOpen(true);
    };

    const handleSaveTabConfig = async () => {
        if (!selectedOrg) return;

        try {
            setIsSubmitting(true);

            const { error } = await supabase
                .from("organizations")
                .update({ allowed_tabs: selectedOrg.allowed_tabs })
                .eq("id", selectedOrg.id);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Tab configuration updated successfully",
            });

            setIsTabConfigOpen(false);
            fetchOrgs();
        } catch (error: any) {
            console.error("Error updating tab configuration:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to update tab configuration",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleTab = (tabId: string) => {
        if (!selectedOrg) return;

        const currentTabs = selectedOrg.allowed_tabs || [];
        const newTabs = currentTabs.includes(tabId)
            ? currentTabs.filter(t => t !== tabId)
            : [...currentTabs, tabId];

        setSelectedOrg({ ...selectedOrg, allowed_tabs: newTabs });
    };

    const selectAllTabs = () => {
        if (!selectedOrg) return;
        setSelectedOrg({ ...selectedOrg, allowed_tabs: AVAILABLE_TABS.map(t => t.id) });
    };

    const deselectAllTabs = () => {
        if (!selectedOrg) return;
        setSelectedOrg({ ...selectedOrg, allowed_tabs: [] });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Organizations</h2>
                    <p className="text-muted-foreground">
                        Manage your organizations here.
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Organization
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Organization</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="org_name">Organization Name</Label>
                                <Input
                                    id="org_name"
                                    placeholder="e.g. Loop University"
                                    value={formData.org_name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, org_name: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="org_code">Organization Code</Label>
                                <Input
                                    id="org_code"
                                    placeholder="e.g. LOOPU"
                                    value={formData.org_code}
                                    onChange={(e) =>
                                        setFormData({ ...formData, org_code: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="org_id">Organization ID (Unique)</Label>
                                <Input
                                    id="org_id"
                                    placeholder="e.g. loop_uni_001"
                                    value={formData.org_id}
                                    onChange={(e) =>
                                        setFormData({ ...formData, org_id: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="org_logo">Logo URL (Optional)</Label>
                                <Input
                                    id="org_logo"
                                    placeholder="https://..."
                                    value={formData.org_logo}
                                    onChange={(e) =>
                                        setFormData({ ...formData, org_logo: e.target.value })
                                    }
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Create Organization
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Tab Configuration Dialog */}
            <Dialog open={isTabConfigOpen} onOpenChange={setIsTabConfigOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Configure Tab Access - {selectedOrg?.org_name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-muted-foreground">
                                Select which tabs this organization can access
                            </p>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={selectAllTabs}>
                                    Select All
                                </Button>
                                <Button size="sm" variant="outline" onClick={deselectAllTabs}>
                                    Deselect All
                                </Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 border rounded-lg p-4 max-h-[400px] overflow-y-auto">
                            {AVAILABLE_TABS.map((tab) => (
                                <div key={tab.id} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id={`tab-${tab.id}`}
                                        checked={selectedOrg?.allowed_tabs?.includes(tab.id) || false}
                                        onChange={() => toggleTab(tab.id)}
                                        className="h-4 w-4 rounded border-gray-300"
                                    />
                                    <Label htmlFor={`tab-${tab.id}`} className="cursor-pointer">
                                        {tab.label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setIsTabConfigOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleSaveTabConfig} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Configuration
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Logo</TableHead>
                            <TableHead>Org Name</TableHead>
                            <TableHead>Org Code</TableHead>
                            <TableHead>Org ID</TableHead>
                            <TableHead>Allowed Tabs</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : orgs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No organizations found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            orgs.map((org) => (
                                <TableRow key={org.id}>
                                    <TableCell>
                                        {org.org_logo ? (
                                            <img
                                                src={org.org_logo}
                                                alt={org.org_name}
                                                className="h-8 w-8 rounded object-cover"
                                            />
                                        ) : (
                                            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs">
                                                N/A
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">{org.org_name}</TableCell>
                                    <TableCell>{org.org_code}</TableCell>
                                    <TableCell>{org.org_id}</TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">
                                            {org.allowed_tabs?.length || 0} / {AVAILABLE_TABS.length} tabs
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleConfigureTabs(org)}
                                            >
                                                Configure Access
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDelete(org.id, org.org_name)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
