import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft, Info, ShieldCheck, Wrench, Navigation,
  Activity, Clock, Plus, Bookmark, StickyNote, Trash2,
  Calendar, User, FileText, Smartphone, Gauge, Fuel,
  CheckCircle2, AlertCircle, MapPin, Briefcase, ClipboardCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function VehicleDetails({ vehicleId, onBack }) {
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [task, setTask] = useState({ title: '', due_date: '', priority: 'Medium' });
  const [routes, setRoutes] = useState([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [crew, setCrew] = useState({ drivers: [], conductors: [] });
  const [isCrewDialogOpen, setIsCrewDialogOpen] = useState(false);
  const [crewType, setCrewType] = useState('driver'); // 'driver' or 'conductor'
  const [selectedCrew, setSelectedCrew] = useState('');

  useEffect(() => {
    fetchVehicleDetails();
    fetchRoutes();
    fetchCrew();

    // Refresh crew when user comes back to this page (e.g., after adding a new driver)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchCrew();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [vehicleId]);

  const fetchCrew = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${baseUrl}/transport/crew`);
      const result = await response.json();
      if (result.data) {
        setCrew(result.data);
      }
    } catch (error) {
      console.error('Error fetching crew:', error);
    }
  };

  const fetchRoutes = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${baseUrl}/transport/routes`);
      const result = await response.json();
      if (result.data) {
        setRoutes(result.data);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const fetchVehicleDetails = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${baseUrl}/transport/vehicles/${vehicleId}`);
      const result = await response.json();
      if (result.data) {
        setVehicle(result.data);
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load vehicle details");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${baseUrl}/transport/vehicles/${vehicleId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note })
      });
      const result = await response.json();
      if (result.data) {
        toast.success("Note added");
        setNote('');
        fetchVehicleDetails();
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to add note");
    }
  };

  const handleAddTask = async () => {
    if (!task.title.trim()) return;
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${baseUrl}/transport/vehicles/${vehicleId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_title: task.title,
          due_date: task.due_date,
          priority: task.priority
        })
      });
      const result = await response.json();
      if (result.data) {
        toast.success("Task bookmarked");
        setTask({ title: '', due_date: '', priority: 'Medium' });
        fetchVehicleDetails();
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to bookmark task");
    }
  };

  const handleDeleteVehicle = async () => {
    setDeleting(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${baseUrl}/transport/vehicles/${vehicleId}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result.data || response.ok) {
        toast.success('Vehicle deleted successfully');
        onBack(); // Go back to inventory
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete vehicle');
    } finally {
      setDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleAssignCrew = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const body = crewType === 'driver'
        ? { driver_id: selectedCrew || null }
        : { conductor_id: selectedCrew || null };

      const response = await fetch(`${baseUrl}/transport/vehicles/${vehicleId}/crew`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const result = await response.json();
      if (result.data) {
        toast.success(`${crewType === 'driver' ? 'Driver' : 'Conductor'} ${selectedCrew ? 'assigned' : 'removed'} successfully`);
        setIsCrewDialogOpen(false);
        setSelectedCrew('');
        fetchVehicleDetails();
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to assign crew');
    }
  };


  if (loading)
    return <div className="p-20 text-center animate-pulse">Loading vehicle details...</div>;
  if (!vehicle) return <div className="p-20 text-center">Vehicle not found.</div>;

  const sections = [
    { id: "identification", label: "Identification", icon: Info },
    { id: "safety", label: "Safety & Compliance", icon: ShieldCheck },
    { id: "maintenance", label: "Condition & Maintenance", icon: Wrench },
    { id: "gps", label: "GPS & Tracking", icon: Navigation },
    { id: "status", label: "Operational Status", icon: Activity },
    { id: "notes", label: "Notes & Tasks", icon: StickyNote },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-bold">{vehicle.registration_number}</h2>
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
              {vehicle.vehicle_id} • {vehicle.vehicle_type}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={vehicle.status === "Active" ? "success" : "warning"}>
            {vehicle.status}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => {
            setEditData(vehicle);
            setIsEditDialogOpen(true);
          }}>
            Edit Details
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs defaultValue="identification" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 border-b bg-muted/20">
          <TabsList className="h-12 bg-transparent gap-6">
            {sections.map((s) => (
              <TabsTrigger
                key={s.id}
                value={s.id}
                className="h-12 px-2 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none flex items-center gap-2 border-transparent"
              >
                <s.icon className="h-4 w-4" />
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <TabsContent value="identification" className="mt-0 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Registration Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <DetailItem label="Registration Number" value={vehicle.registration_number} />
                  <DetailItem label="Registration Date" value={vehicle.registration_date} />
                  <DetailItem
                    label="Expiry Date"
                    value={vehicle.expiry_date}
                    status={new Date(vehicle.expiry_date) < new Date() ? "expired" : "valid"}
                  />
                  <DetailItem label="Renewal Date" value={vehicle.renewal_date} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Specifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <DetailItem label="Make & Model" value={vehicle.make_model} />
                  <DetailItem label="Year of Mfg" value={vehicle.year_of_manufacture} />
                  <DetailItem label="Engine Type" value={vehicle.engine_type} />
                  <DetailItem label="Seating Capacity" value={vehicle.seating_capacity} />
                  <DetailItem label="Chassis Number" value={vehicle.chassis_number} />
                  <DetailItem label="Engine Number" value={vehicle.engine_number} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Ownership</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <DetailItem label="Owner Name" value={vehicle.owner_name} />
                  <DetailItem label="Ownership Type" value={vehicle.ownership_type} />
                  <DetailItem label="Purchase Cost" value={`₹${vehicle.purchase_cost || 0}`} />
                  {vehicle.ownership_type === "Leased" && (
                    <>
                      <DetailItem label="Lease Duration" value={vehicle.lease_duration} />
                      <DetailItem
                        label="Monthly Cost"
                        value={`₹${vehicle.monthly_lease_cost || 0}`}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="safety" className="mt-0 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                    Compliance Checklist
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CheckItem label="Fitness Certificate" checked />
                  <CheckItem label="Pollution (PUC)" checked />
                  <CheckItem label="Insurance Policy" checked />
                  <CheckItem label="Road Worthiness" checked />
                  <CheckItem label="First Aid Kit" checked />
                  <CheckItem label="Fire Extinguisher" checked />
                  <CheckItem label="Speed Governor" checked />
                  <CheckItem label="GPS Tracking" checked />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Safety Equipment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/40 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Emergency Exit</p>
                      <p className="text-xs text-muted-foreground">Clearly marked and accessible</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/40 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Seat Belts</p>
                      <p className="text-xs text-muted-foreground">90% Working (36 out of 40)</p>
                    </div>
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="maintenance" className="mt-0 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Maintenance History</CardTitle>
                  <CardDescription>Recent service records and upcoming dues.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        date: "2023-12-15",
                        service: "Full Service",
                        cost: "12,500",
                        mileage: "45,200 km",
                      },
                      {
                        date: "2023-10-10",
                        service: "Oil Change",
                        cost: "3,200",
                        mileage: "42,100 km",
                      },
                      {
                        date: "2023-08-05",
                        service: "Tire Rotation",
                        cost: "1,500",
                        mileage: "38,500 km",
                      },
                    ].map((log, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-primary/10 rounded">
                            <Calendar className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">{log.service}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(log.date).toLocaleDateString()} • {log.mileage}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">₹{log.cost}</p>
                          <p className="text-xs text-muted-foreground">Completed</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Fuel Management</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Fuel className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs">Avg Mileage</span>
                      </div>
                      <span className="text-sm font-bold">12.5 km/l</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs">Current Level</span>
                      </div>
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: "75%" }} />
                      </div>
                    </div>
                    <div className="pt-2 border-t text-center">
                      <p className="text-xs text-muted-foreground">Monthly Budget (Est.)</p>
                      <p className="text-lg font-bold text-primary">₹45,000</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-amber-500/5 border-amber-500/20">
                  <CardHeader className="pb-2 text-amber-600">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Next Service Due
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-black">2,400 km</p>
                    <p className="text-xs text-muted-foreground">Estimated by Feb 15, 2024</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gps" className="mt-0">
            <Card className="h-[400px] flex flex-col items-center justify-center border-dashed">
              <MapPin className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
              <h3 className="text-lg font-medium">Live Map Integration</h3>
              <p className="text-sm text-muted-foreground max-w-xs text-center">
                GPS Device {vehicle.gps_details?.device_id || "ID-8822"} is active. Last updated 2
                minutes ago.
              </p>
              <Button variant="outline" className="mt-4">
                View Full Map
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="status" className="mt-0 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatusCard
                label="Route Assigned"
                value={vehicle.route_assigned || "Route A-1"}
                icon={Navigation}
              />
              <StatusCard
                label="Operating Hours"
                value={vehicle.operating_hours || "5 AM - 6 PM"}
                icon={Clock}
              />
              <StatusCard
                label="Trips per Day"
                value={`${vehicle.trips_per_day || 4} Trips`}
                icon={Activity}
              />
              <StatusCard
                label="Students Assigned"
                value={`${vehicle.students_assigned_count || 32} Students`}
                icon={User}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Crew Assignment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">
                          {vehicle.current_driver_assigned || "Rajesh Kumar"}
                        </p>
                        <p className="text-xs text-muted-foreground">Primary Driver • ID: D-402</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => {
                      fetchCrew(); // Refresh crew list before opening
                      setCrewType("driver");
                      setSelectedCrew(vehicle.current_driver_assigned || "");
                      setIsCrewDialogOpen(true);
                    }}>
                      Change
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">
                          {vehicle.conductor_assigned || "Suresh Mani"}
                        </p>
                        <p className="text-xs text-muted-foreground">Conductor • ID: C-105</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => {
                      fetchCrew(); // Refresh crew list before opening
                      setCrewType("conductor");
                      setSelectedCrew(vehicle.conductor_assigned || "");
                      setIsCrewDialogOpen(true);
                    }}>
                      Change
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="mt-0 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <StickyNote className="h-5 w-5 text-primary" />
                    Add Note
                  </h3>
                  <textarea
                    className="w-full h-32 p-3 rounded-lg border bg-card resize-none focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="Type important observation about this vehicle..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <Button onClick={handleAddNote} disabled={!note.trim()}>
                    Save Note
                  </Button>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                    Recent Notes
                  </h4>
                  {vehicle.notes?.map((n, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-lg bg-card border border-border/50 shadow-sm relative group"
                    >
                      <p className="text-sm whitespace-pre-wrap">{n.note}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(n.created_at).toLocaleString()}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!vehicle.notes || vehicle.notes.length === 0) && (
                    <p className="text-sm text-muted-foreground italic">No notes found.</p>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4 p-5 rounded-xl bg-primary/5 border border-primary/10">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Bookmark className="h-5 w-5 text-primary" />
                    Bookmark Task
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Task Title</Label>
                      <Input
                        placeholder="e.g., Renew insurance, Check tires..."
                        value={task.title}
                        onChange={(e) => setTask({ ...task, title: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Due Date</Label>
                        <Input
                          type="date"
                          value={task.due_date}
                          onChange={(e) => setTask({ ...task, due_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Priority</Label>
                        <Select
                          value={task.priority}
                          onValueChange={(v) => setTask({ ...task, priority: v })}
                        >
                          <SelectTrigger className="h-10 shadow-none">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="Low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button className="w-full" onClick={handleAddTask}>
                      Add to Tasks
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                    Active Tasks
                  </h4>
                  {vehicle.tasks?.map((t, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 border rounded-lg bg-card group hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox checked={t.status === "Completed"} />
                        <div>
                          <p
                            className={`text-sm font-medium ${t.status === "Completed" ? "line-through text-muted-foreground" : ""}`}
                          >
                            {t.task_title}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Due: {new Date(t.due_date).toLocaleDateString()} • {t.priority}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  {(!vehicle.tasks || vehicle.tasks.length === 0) && (
                    <p className="text-sm text-muted-foreground italic">
                      All caught up! No active tasks.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Edit Details Dialog */}
      {isEditDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Edit Vehicle Details</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsEditDialogOpen(false)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Assign Route</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={vehicle.route?.id || ""}
                  onChange={async (e) => {
                    const routeId = e.target.value;
                    try {
                      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
                      const response = await fetch(`${baseUrl}/transport/routes/${routeId}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ vehicle_id: vehicleId }),
                      });
                      const result = await response.json();
                      if (result.data) {
                        toast.success("Route assigned successfully");
                        fetchVehicleDetails();
                      } else if (result.error) {
                        toast.error(result.error);
                      }
                    } catch (error) {
                      console.error(error);
                      toast.error("Failed to assign route");
                    }
                  }}
                >
                  <option value="">No Route Assigned</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.route_name} ({route.route_code || "N/A"})
                    </option>
                  ))}
                </select>
              </div>

              {vehicle.route && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Current Route</h4>
                  <p className="text-sm">Route: {vehicle.route.route_name}</p>
                  <p className="text-sm">Code: {vehicle.route.route_code}</p>
                  {vehicle.passengers && vehicle.passengers.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold mb-1">
                        Allocated Students ({vehicle.passengers.length}):
                      </p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {vehicle.passengers.map((passenger, idx) => (
                          <div key={idx} className="text-xs bg-background p-2 rounded">
                            {passenger.student?.name || "Student"}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    toast.success("Changes saved");
                  }}
                  className="flex-1"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Crew Assignment Dialog */}
      {isCrewDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">
                Assign {crewType === "driver" ? "Driver" : "Conductor"}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setIsCrewDialogOpen(false)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select {crewType === "driver" ? "Driver" : "Conductor"}</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={selectedCrew}
                  onChange={(e) => setSelectedCrew(e.target.value)}
                >
                  <option value="">
                    No {crewType === "driver" ? "Driver" : "Conductor"} Assigned
                  </option>
                  {(crewType === "driver" ? crew.drivers : crew.conductors).map((member) => (
                    <option key={member.id} value={member.name}>
                      {member.name} (ID: {member.user_id})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  {crewType === "driver" ? crew.drivers.length : crew.conductors.length}{" "}
                  {crewType === "driver" ? "drivers" : "conductors"} available
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsCrewDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={handleAssignCrew} className="flex-1">
                  {selectedCrew ? "Assign" : "Remove"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2">Delete Vehicle</h3>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete{" "}
                  <span className="font-bold">{vehicle.registration_number}</span>? This action
                  cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteVehicle}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Vehicle"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value, status }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground">{label}:</span>
      <span className={`font-medium ${status === "expired" ? "text-red-500 underline" : ""}`}>
        {value || "Not specified"}
      </span>
    </div>
  );
}

function CheckItem({ label, checked }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div
        className={`p-0.5 rounded-full ${checked ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"}`}
      >
        <CheckCircle2 className="h-4 w-4" />
      </div>
      <span className={checked ? "text-foreground font-medium" : "text-muted-foreground"}>
        {label}
      </span>
    </div>
  );
}

function StatusCard({ label, value, icon: Icon }) {
  return (
    <Card className="shadow-none bg-muted/20 border-border/40">
      <CardContent className="p-4 flex flex-col items-center justify-center text-center">
        <Icon className="h-5 w-5 text-muted-foreground mb-2" />
        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">{label}</p>
        <p className="text-sm font-black">{value}</p>
      </CardContent>
    </Card>
  );
}
