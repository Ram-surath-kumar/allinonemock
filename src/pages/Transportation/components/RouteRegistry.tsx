import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MapPin, Plus, Clock, AlertTriangle, ShieldCheck, Banknote } from "lucide-react";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function RouteRegistry() {
  const { toast } = useToast();
  const [routes, setRoutes] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string>("");

  const handleRouteSelect = (routeId: string) => {
    setSelectedRouteId(routeId);
  };

  // Detailed Form State
  const [newRoute, setNewRoute] = useState({
    route_name: "",
    route_code: "", // RT-001
    vehicle_id: "",
    route_type: "Morning", // Morning, Evening, Both
    start_point: "",
    end_point: "",
    distance_km: "",
    est_travel_time_mins: "",
    frequency: "Daily",
    operating_days: "Mon-Fri",
    departure_time_start: "",
    arrival_time_campus: "",

    // Cost & Efficiency
    avg_cost_per_student: "800",

    // Safety
    emergency_assembly_point: "",
    hospital_nearby_name: "",
    hospital_nearby_contact: "",
    road_hazards_note: "",

    stops: [] as any[],
  });

  const [currentStop, setCurrentStop] = useState({
    stop_name: "",
    arrival_time: "",
    stop_duration_mins: 2,
    avg_boarding_count: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [routesRes, vehiclesRes] = await Promise.all([
        api.get<any[]>("/transport/routes"),
        api.get<any[]>("/transport/vehicles"),
      ]);
      if (routesRes.data) setRoutes(routesRes.data);
      if (vehiclesRes.data) setVehicles(vehiclesRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddStop = () => {
    if (!currentStop.stop_name) return;
    setNewRoute((prev) => ({
      ...prev,
      stops: [...prev.stops, { ...currentStop }],
    }));
    setCurrentStop({
      stop_name: "",
      arrival_time: "",
      stop_duration_mins: 2,
      avg_boarding_count: 0,
    });
  };

  const handleCreateRoute = async () => {
    const res = await api.post("/transport/routes", newRoute);
    if (res.data) {
      toast({ title: "Success", description: "Route created successfully" });
      setOpenDialog(false);
      loadData();
    } else {
      toast({ title: "Error", description: res.error || "Failed", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Route Registry</h2>
          <p className="text-muted-foreground">
            Manage complex route schedules, stops, and risk assessments.
          </p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button>Add New Route</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Advanced Route</DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="safety">Safety & Risk</TabsTrigger>
                <TabsTrigger value="stops">Stops</TabsTrigger>
              </TabsList>

              {/* BASIC INFO */}
              <TabsContent value="basic" className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Route Name</Label>
                    <Input
                      value={newRoute.route_name}
                      onChange={(e) => setNewRoute({ ...newRoute, route_name: e.target.value })}
                      placeholder="e.g. Bandra to Campus"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Route ID</Label>
                    <Input
                      value={newRoute.route_code}
                      onChange={(e) => setNewRoute({ ...newRoute, route_code: e.target.value })}
                      placeholder="RT-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <select
                      className="flex h-10 w-full rounded-md border bg-background px-3"
                      value={newRoute.route_type}
                      onChange={(e) => setNewRoute({ ...newRoute, route_type: e.target.value })}
                    >
                      <option>Morning</option>
                      <option>Evening</option>
                      <option>Both</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Vehicle</Label>
                    <select
                      className="flex h-10 w-full rounded-md border bg-background px-3"
                      value={newRoute.vehicle_id}
                      onChange={(e) => setNewRoute({ ...newRoute, vehicle_id: e.target.value })}
                    >
                      <option value="">Select Vehicle</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.vehicle_number}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Start Point</Label>
                    <Input
                      value={newRoute.start_point}
                      onChange={(e) => setNewRoute({ ...newRoute, start_point: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Point</Label>
                    <Input
                      value={newRoute.end_point}
                      onChange={(e) => setNewRoute({ ...newRoute, end_point: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* SCHEDULE */}
              <TabsContent value="schedule" className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Departure Time</Label>
                    <Input
                      type="time"
                      value={newRoute.departure_time_start}
                      onChange={(e) =>
                        setNewRoute({ ...newRoute, departure_time_start: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Campus Arrival Time</Label>
                    <Input
                      type="time"
                      value={newRoute.arrival_time_campus}
                      onChange={(e) =>
                        setNewRoute({ ...newRoute, arrival_time_campus: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Est. Travel Time (mins)</Label>
                    <Input
                      type="number"
                      value={newRoute.est_travel_time_mins}
                      onChange={(e) =>
                        setNewRoute({ ...newRoute, est_travel_time_mins: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Operating Days</Label>
                    <Input
                      value={newRoute.operating_days}
                      onChange={(e) => setNewRoute({ ...newRoute, operating_days: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* SAFETY */}
              <TabsContent value="safety" className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Emergency Assembly Point</Label>
                    <Input
                      value={newRoute.emergency_assembly_point}
                      onChange={(e) =>
                        setNewRoute({ ...newRoute, emergency_assembly_point: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nearby Hospital</Label>
                    <Input
                      value={newRoute.hospital_nearby_name}
                      onChange={(e) =>
                        setNewRoute({ ...newRoute, hospital_nearby_name: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Risk Mitigation Notes</Label>
                    <Textarea
                      placeholder="Traffic prone areas, high risk zones..."
                      value={newRoute.road_hazards_note}
                      onChange={(e) =>
                        setNewRoute({ ...newRoute, road_hazards_note: e.target.value })
                      }
                    />
                  </div>
                </div>
              </TabsContent>

              {/* STOPS */}
              <TabsContent value="stops" className="space-y-4 py-4">
                <div className="flex gap-2 items-end">
                  <div className="space-y-2 flex-1">
                    <Label>Stop Name</Label>
                    <Input
                      value={currentStop.stop_name}
                      onChange={(e) =>
                        setCurrentStop({ ...currentStop, stop_name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2 w-32">
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={currentStop.arrival_time}
                      onChange={(e) =>
                        setCurrentStop({ ...currentStop, arrival_time: e.target.value })
                      }
                    />
                  </div>
                  <Button onClick={handleAddStop}>Add</Button>
                </div>
                <ScrollArea className="h-40 border rounded p-2">
                  {newRoute.stops.map((stop, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center py-2 border-b last:border-0"
                    >
                      <span>
                        {idx + 1}. {stop.stop_name}
                      </span>
                      <Badge variant="outline">{stop.arrival_time}</Badge>
                    </div>
                  ))}
                  {newRoute.stops.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No stops added.</p>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button onClick={handleCreateRoute}>Create Route</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* ROUTES GRID */}
      <RadioGroup value={selectedRouteId} onValueChange={handleRouteSelect}>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routes.map((route) => (
            <label
              key={route.id}
              htmlFor={`route-${route.id}`}
              className={cn(
                "block cursor-pointer",
                selectedRouteId === String(route.id) &&
                  "ring-2 ring-primary ring-offset-2 rounded-lg"
              )}
            >
              <Card
                className={cn(
                  "hover:shadow-lg transition-all group relative h-full",
                  selectedRouteId === String(route.id) && "border-primary"
                )}
              >
                <CardHeader className="pb-3 bg-muted/20">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem
                        value={String(route.id)}
                        id={`route-${route.id}`}
                        className="mt-1"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Badge variant="outline">{route.route_id}</Badge>
                    </div>
                    <Badge className={route.status === "active" ? "bg-green-500" : "bg-gray-500"}>
                      {route.status}
                    </Badge>
                  </div>
                  <CardTitle className="mt-2">{route.route_name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {route.operating_days} (
                    {route.departure_time_start} - {route.arrival_time_campus})
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> Start
                    </span>
                    <span>{route.start_point}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> End
                    </span>
                    <span>{route.end_point}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                      <p className="text-xs text-muted-foreground">Capacity</p>
                      <p className="font-bold">{route.vehicle?.capacity || 0} Seats</p>
                    </div>
                    <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                      <p className="text-xs text-muted-foreground">Cost/Student</p>
                      <p className="font-bold">₹{route.avg_cost_per_student}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <ShieldCheck className="h-3 w-3" /> Safe
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Banknote className="h-3 w-3" /> Profitable
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </label>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
}
