import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bus, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';

export function VehicleAssignment({ onUpdate }) {
    const [vehicles, setVehicles] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [vehiclesRes, routesRes] = await Promise.all([
                api.get('/transport/vehicles'),
                api.get('/transport/routes')
            ]);

            if (vehiclesRes.data) setVehicles(vehiclesRes.data);
            if (routesRes.data) setRoutes(routesRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load vehicles and routes');
        } finally {
            setLoading(false);
        }
    };

    const assignVehicleToRoute = async (vehicleId, routeId) => {
        try {
            const response = await api.put(`/transport/routes/${routeId}`, { vehicle_id: vehicleId });
            if (response.data) {
                toast.success('Vehicle assigned to route successfully');
                fetchData();
                onUpdate?.();
            } else {
                toast.error(response.error || 'Failed to assign vehicle');
            }
        } catch (error) {
            console.error('Error assigning vehicle:', error);
            toast.error('An error occurred');
        }
    };

    const unassignVehicle = async (routeId) => {
        try {
            const response = await api.put(`/transport/routes/${routeId}`, { vehicle_id: null });
            if (response.data) {
                toast.success('Vehicle unassigned successfully');
                fetchData();
                onUpdate?.();
            } else {
                toast.error(response.error || 'Failed to unassign vehicle');
            }
        } catch (error) {
            console.error('Error unassigning vehicle:', error);
            toast.error('An error occurred');
        }
    };

    const getRouteForVehicle = (vehicleId) => {
        return routes.find(route => route.vehicle_id === vehicleId);
    };

    const getAvailableRoutes = (vehicleId) => {
        return routes.filter(route => !route.vehicle_id || route.vehicle_id === vehicleId);
    };

    if (loading) {
        return <div className="text-center py-8">Loading vehicles...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Vehicle-Route Assignment</h3>
                <p className="text-sm text-muted-foreground">
                    Assign vehicles to routes for operational planning
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vehicles.map((vehicle) => {
                    const assignedRoute = getRouteForVehicle(vehicle.id);
                    const availableRoutes = getAvailableRoutes(vehicle.id);

                    return (
                        <Card key={vehicle.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <Bus className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">{vehicle.registration_number}</h4>
                                            <p className="text-sm text-muted-foreground">{vehicle.vehicle_type}</p>
                                        </div>
                                    </div>
                                    <Badge variant={assignedRoute ? 'default' : 'secondary'}>
                                        {assignedRoute ? 'Assigned' : 'Available'}
                                    </Badge>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Current Assignment:
                                    </p>
                                    {assignedRoute ? (
                                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-green-900">{assignedRoute.route_name}</p>
                                                    <p className="text-xs text-green-700">{assignedRoute.route_code}</p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => unassignVehicle(assignedRoute.id)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    Unassign
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">Not assigned to any route</p>
                                    )}
                                </div>

                                {availableRoutes.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-medium text-muted-foreground">
                                            Assign to Route:
                                        </p>
                                        <select
                                            className="w-full p-2 border rounded-md text-sm"
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    assignVehicleToRoute(vehicle.id, e.target.value);
                                                    e.target.value = ''; // Reset selection
                                                }
                                            }}
                                            defaultValue=""
                                        >
                                            <option value="" disabled>Select a route...</option>
                                            {availableRoutes.map((route) => (
                                                <option key={route.id} value={route.id}>
                                                    {route.route_name} ({route.route_code})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {availableRoutes.length === 0 && !assignedRoute && (
                                    <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                                        All routes are assigned. Create new routes to assign this vehicle.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}

                {vehicles.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        <Bus className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>No vehicles found. Add vehicles from the Facilities page first.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
