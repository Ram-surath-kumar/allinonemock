import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, BedDouble, Users, AlertCircle, Plus, Search, Filter } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { AddHostelDialog } from './AddHostelDialog';
import { AllocationDialog } from './AllocationDialog';

export default function HostelDashboard() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [addHostelOpen, setAddHostelOpen] = useState(false);
    const [allocationOpen, setAllocationOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const response = await api.getHostelDashboard();
            if (response.error) {
                throw new Error(response.error);
            }
            setData(response.data);
        } catch (error: any) {
            toast.error(error.message || 'Failed to load hostel data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading hostel dashboard...</div>;
    }

    const stats = data?.stats || {};

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Hostel Management</h1>
                    <p className="text-muted-foreground mt-1">Manage infrastructure, allocations, and residents</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => loadData()}>
                        Refresh
                    </Button>
                    <Button className="shad-button-primary" onClick={() => setAllocationOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> New Allocation
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shad-card hover-lift">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
                        <BedDouble className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total_capacity || 0}</div>
                        <p className="text-xs text-muted-foreground">Beds across all hostels</p>
                    </CardContent>
                </Card>

                <Card className="shad-card hover-lift">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
                        <Users className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{Math.round(stats.occupancy_rate || 0)}%</div>
                        <p className="text-xs text-muted-foreground">{stats.active_students || 0} active residents</p>
                    </CardContent>
                </Card>

                <Card className="shad-card hover-lift">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pending_applications || 0}</div>
                        <p className="text-xs text-muted-foreground">Awaiting approval</p>
                    </CardContent>
                </Card>

                <Card className="shad-card hover-lift">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Hostels</CardTitle>
                        <Building2 className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.hostels?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">Buildings managed</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="allocations">Allocations</TabsTrigger>
                    <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
                    <TabsTrigger value="finance">Finance</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <Card className="shad-card">
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground">
                                No recent activity to display.
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="allocations">
                    <Card className="shad-card">
                        <CardHeader>
                            <CardTitle>Pending Applications</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {data?.applications?.length === 0 ? (
                                <p className="text-muted-foreground">No pending applications.</p>
                            ) : (
                                <div className="space-y-4">
                                    {data?.applications?.map((app: any) => (
                                        <div key={app.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                            <div>
                                                <p className="font-medium">Student Application</p>
                                                <p className="text-sm text-muted-foreground">Applied on {new Date(app.application_date).toLocaleDateString()}</p>
                                            </div>
                                            <Button size="sm" variant="outline">Review</Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="infrastructure">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {data?.hostels?.map((hostel: any) => (
                            <Card key={hostel.id} className="cursor-pointer hover:border-primary transition-colors">
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-center">
                                        {hostel.name}
                                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{hostel.type}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Capacity</span>
                                            <span>{hostel.capacity} beds</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Location</span>
                                            <span>{hostel.address || 'N/A'}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        <Card
                            className="flex flex-col items-center justify-center p-6 border-dashed cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => setAddHostelOpen(true)}
                        >
                            <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="font-medium text-muted-foreground">Add New Hostel</p>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="finance">
                    <Card className="shad-card">
                        <CardHeader>
                            <CardTitle>Fee Collection</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">No fee records found.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <AddHostelDialog
                open={addHostelOpen}
                onOpenChange={setAddHostelOpen}
                onSuccess={loadData}
            />

            <AllocationDialog
                open={allocationOpen}
                onOpenChange={setAllocationOpen}
                onSuccess={loadData}
                hostels={data?.hostels || []}
                rooms={data?.rooms || []}
                beds={data?.beds || []}
            />
        </div>
    );
}
