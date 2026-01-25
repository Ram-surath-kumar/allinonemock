import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, BedDouble, Users, AlertCircle, Plus, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/services/api";
import { toast } from "sonner";
import { AddHostelDialog } from "./AddHostelDialog";
import { AllocationDialog } from "./AllocationDialog";
import { EditHostelDialog } from "./EditHostelDialog";
import { HostelFees } from "@/pages/finance/HostelFees";

export default function HostelDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [addHostelOpen, setAddHostelOpen] = useState(false);
  const [allocationOpen, setAllocationOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hostelToDelete, setHostelToDelete] = useState<any>(null);
  const [editHostelOpen, setEditHostelOpen] = useState(false);
  const [hostelToEdit, setHostelToEdit] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getHostelDashboard();
      if (response.error) {
        throw new Error(response.error);
      }
      setData(response.data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load hostel data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteHostel = async () => {
    if (!hostelToDelete) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3001/api"}/hostel/${hostelToDelete.id}`,
        {
          method: "DELETE",
        }
      );
      const result = await response.json();

      if (response.ok && !result.error) {
        toast.success("Hostel deleted successfully");
        loadData();
        setDeleteDialogOpen(false);
        setHostelToDelete(null);
      } else {
        toast.error(result.error || "Failed to delete hostel");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete hostel");
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
          <p className="text-muted-foreground mt-1">
            Manage infrastructure, allocations, and residents
          </p>
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
            <p className="text-xs text-muted-foreground">
              {stats.active_students || 0} active residents
            </p>
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

      <Tabs defaultValue="allocations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="allocations">Allocations</TabsTrigger>
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
        </TabsList>

        <TabsContent value="allocations">
          <Card className="shad-card">
            <CardHeader>
              <CardTitle>Current Allocations</CardTitle>
            </CardHeader>
            <CardContent>
              {!data?.allocations || data.allocations.length === 0 ? (
                <p className="text-muted-foreground">No allocations found.</p>
              ) : (
                <div className="space-y-3">
                  {data.allocations.map((allocation: any) => (
                    <div
                      key={allocation.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-lg">
                            {allocation.user?.name || "Unknown Student"}
                          </p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${allocation.status === "active"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-400"
                              }`}
                          >
                            {allocation.status || "N/A"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <span>{allocation.user?.email || "No email"}</span>
                          {allocation.user?.loopid && (
                            <>
                              <span className="text-muted-foreground/30">•</span>
                              <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                                ID: {allocation.user.loopid}
                              </span>
                            </>
                          )}
                        </p>
                        <div className="flex items-center gap-4 text-sm mt-2">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{allocation.hostel?.name || "Unknown Hostel"}</span>
                            <span className="text-xs text-muted-foreground">
                              ({allocation.hostel?.type || "N/A"})
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BedDouble className="h-4 w-4 text-muted-foreground" />
                            <span>
                              Floor {allocation.room?.floor_number || "?"}, Room{" "}
                              {allocation.room?.room_number || "Unknown"}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Allocated:{" "}
                          {allocation.allocated_date
                            ? new Date(allocation.allocated_date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                            : "Date not available"}
                        </p>
                      </div>
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
              <Card
                key={hostel.id}
                className="hover:border-primary transition-colors relative group"
              >
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <span className="flex-1">{hostel.name}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {hostel.type}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setHostelToEdit(hostel);
                          setEditHostelOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setHostelToDelete(hostel);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
                      <span>{hostel.address || "N/A"}</span>
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
          <HostelFees />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Hostel</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{hostelToDelete?.name}</strong>? This will
              also delete all associated rooms and allocations. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteHostel}>
              Delete Hostel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddHostelDialog open={addHostelOpen} onOpenChange={setAddHostelOpen} onSuccess={loadData} />

      <AllocationDialog
        open={allocationOpen}
        onOpenChange={setAllocationOpen}
        onSuccess={loadData}
        hostels={data?.hostels || []}
        rooms={data?.rooms || []}
        beds={data?.beds || []}
      />

      <EditHostelDialog
        open={editHostelOpen}
        onOpenChange={setEditHostelOpen}
        onSuccess={loadData}
        hostel={hostelToEdit}
      />
    </div>
  );
}
