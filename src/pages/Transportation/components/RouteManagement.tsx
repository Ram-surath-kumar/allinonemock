import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, MapPin, Bus, LayoutList, Clock, Check } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { Badge } from '@/components/ui/badge';

export function RouteManagement({ onUpdate }) {
    const [routes, setRoutes] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRoute, setEditingRoute] = useState(null);
    const [formData, setFormData] = useState({
        route_name: '',
        route_code: '',
        vehicle_ids: [],
        departure_time_start: '',
        arrival_time_campus: '',
        status: 'active',
        stops: []
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [routesRes, vehiclesRes] = await Promise.all([
                api.get('/transport/routes'),
                api.get('/transport/vehicles')
            ]);

            if (routesRes.data) setRoutes(routesRes.data);
            if (vehiclesRes.data) setVehicles(vehiclesRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load routes');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingRoute) {
                // Update route
                const response = await api.put(`/transport/routes/${editingRoute.id}`, formData);
                if (response.data) {
                    toast.success('Route updated successfully');
                } else {
                    toast.error(response.error || 'Failed to update route');
                }
            } else {
                // Create new route
                const response = await api.post('/transport/routes', formData);
                if (response.data) {
                    toast.success('Route created successfully');
                } else {
                    toast.error(response.error || 'Failed to create route');
                }
            }

            setIsDialogOpen(false);
            resetForm();
            fetchData();
            onUpdate?.();
        } catch (error) {
            console.error('Error saving route:', error);
            toast.error('An error occurred');
        }
    };

    const handleEdit = (route) => {
        setEditingRoute(route);
        setFormData({
            route_name: route.route_name || '',
            route_code: route.route_code || '',
            vehicle_ids: route.vehicles ? route.vehicles.map(v => v.id) : (route.vehicle_id ? [route.vehicle_id] : []),
            departure_time_start: route.departure_time_start || '',
            arrival_time_campus: route.arrival_time_campus || '',
            status: route.status || 'active',
            stops: route.stops || []
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (routeId) => {
        if (!confirm('Are you sure you want to delete this route?')) return;

        try {
            const response = await api.delete(`/transport/routes/${routeId}`);
            if (response.data) {
                toast.success('Route deleted successfully');
                fetchData();
                onUpdate?.();
            } else {
                toast.error(response.error || 'Failed to delete route');
            }
        } catch (error) {
            console.error('Error deleting route:', error);
            toast.error('An error occurred');
        }
    };

    const resetForm = () => {
        setFormData({
            route_name: '',
            route_code: '',
            vehicle_ids: [],
            departure_time_start: '',
            arrival_time_campus: '',
            status: 'active',
            stops: []
        });
        setEditingRoute(null);
    };

    const toggleVehicle = (vehicleId) => {
        setFormData(prev => {
            const current = [...prev.vehicle_ids];
            if (current.includes(vehicleId)) {
                return { ...prev, vehicle_ids: current.filter(id => id !== vehicleId) };
            } else {
                return { ...prev, vehicle_ids: [...current, vehicleId] };
            }
        });
    };

    const addStop = () => {
        setFormData(prev => ({
            ...prev,
            stops: [...prev.stops, { stop_name: '', arrival_time: '' }]
        }));
    };

    const updateStop = (index, field, value) => {
        const newStops = [...formData.stops];
        newStops[index] = { ...newStops[index], [field]: value };
        setFormData({ ...formData, stops: newStops });
    };

    const removeStop = (index) => {
        const newStops = [...formData.stops];
        newStops.splice(index, 1);
        setFormData({ ...formData, stops: newStops });
    };

    const getAssignedVehicles = (route) => {
        if (route.vehicles && route.vehicles.length > 0) return route.vehicles;
        if (route.vehicle) return [route.vehicle]; // Backward compat
        return [];
    };

    if (loading) {
        return <div className="text-center py-8">Loading routes...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Transport Routes</h3>
                <Button onClick={() => {
                    resetForm();
                    setIsDialogOpen(true);
                }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Route
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {routes.map((route) => {
                    const assignedVehicles = getAssignedVehicles(route);
                    const stopCount = route.stops ? route.stops.length : 0;

                    return (
                        <Card key={route.id} className="group">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center justify-between">
                                    <span className="truncate pr-2">{route.route_name}</span>
                                    <span className={`text-xs px-2 py-1 rounded shrink-0 ${route.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {route.status}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center text-sm gap-2">
                                    <span className="font-medium min-w-[60px]">Code:</span>
                                    <span className="bg-muted px-2 py-0.5 rounded text-xs font-mono">{route.route_code || 'N/A'}</span>
                                </div>

                                <div className="group/v">
                                    <div className="flex items-center text-sm gap-2 mb-1">
                                        <span className="font-medium min-w-[60px]">Vehicles:</span>
                                        <Badge variant="outline" className="font-normal cursor-help">
                                            {assignedVehicles.length} {assignedVehicles.length === 1 ? 'Bus' : 'Buses'}
                                        </Badge>
                                    </div>
                                    {assignedVehicles.length > 0 && (
                                        <div className="pl-[68px] text-xs text-muted-foreground hidden group-hover/v:block animate-fade-in">
                                            {assignedVehicles.map(v => v.registration_number).join(', ')}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between text-sm pt-1">
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3 text-muted-foreground" />
                                        <span>{route.departure_time_start || '--:--'}</span>
                                        <span className="text-muted-foreground mx-1">→</span>
                                        <span>{route.arrival_time_campus || '--:--'}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <MapPin className="h-3 w-3" />
                                        <span>{stopCount} Stops</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2 border-t mt-2">
                                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(route)}>
                                        <Edit className="h-3 w-3 mr-1" />
                                        Edit
                                    </Button>
                                    <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleDelete(route.id)}>
                                        <Trash2 className="h-3 w-3 mr-1" />
                                        Delete
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {routes.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                        <MapPin className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>No routes found. Create your first transport route.</p>
                    </div>
                )}
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingRoute ? 'Edit Route' : 'Add New Route'}</DialogTitle>
                        <DialogDescription>
                            {editingRoute ? 'Update route details, vehicles, and stops' : 'Create a new transport route'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="route_name">Route Name *</Label>
                                <Input
                                    id="route_name"
                                    required
                                    value={formData.route_name}
                                    onChange={(e) => setFormData({ ...formData, route_name: e.target.value })}
                                    placeholder="e.g., North Campus Route"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="route_code">Route Code</Label>
                                <Input
                                    id="route_code"
                                    value={formData.route_code}
                                    onChange={(e) => setFormData({ ...formData, route_code: e.target.value })}
                                    placeholder="e.g., RT-001"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="departure_time_start">Departure Time</Label>
                                <Input
                                    id="departure_time_start"
                                    type="time"
                                    value={formData.departure_time_start}
                                    onChange={(e) => setFormData({ ...formData, departure_time_start: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="arrival_time_campus">Arrival Time</Label>
                                <Input
                                    id="arrival_time_campus"
                                    type="time"
                                    value={formData.arrival_time_campus}
                                    onChange={(e) => setFormData({ ...formData, arrival_time_campus: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Vehicle Assignment */}
                        <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                            <Label className="flex items-center gap-2">
                                <Bus className="h-4 w-4" />
                                Assigned Vehicles
                            </Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                                {vehicles.map((vehicle) => {
                                    const isSelected = formData.vehicle_ids.includes(vehicle.id);
                                    return (
                                        <div
                                            key={vehicle.id}
                                            onClick={() => toggleVehicle(vehicle.id)}
                                            className={`
                                                cursor-pointer border rounded px-3 py-2 text-sm flex items-center justify-between transition-colors
                                                ${isSelected ? 'bg-primary/10 border-primary text-primary font-medium' : 'bg-background hover:bg-muted'}
                                            `}
                                        >
                                            <span>{vehicle.registration_number}</span>
                                            {isSelected && <Check className="h-3 w-3" />}
                                        </div>
                                    );
                                })}
                                {vehicles.length === 0 && <p className="text-xs text-muted-foreground col-span-3">No vehicles available. Add vehicles first.</p>}
                            </div>
                        </div>

                        {/* Stops Management */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2">
                                    <LayoutList className="h-4 w-4" />
                                    Pickup Points / Stops
                                </Label>
                                <Button type="button" size="sm" variant="ghost" onClick={addStop}>
                                    <Plus className="h-3 w-3 mr-1" /> Add Stop
                                </Button>
                            </div>

                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                {formData.stops.map((stop, idx) => (
                                    <div key={idx} className="flex gap-2 items-start animate-fade-in-up">
                                        <div className="flex-none pt-2 text-xs text-muted-foreground w-6 font-mono text-center">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <Input
                                                placeholder="Stop Name (e.g. Central Plaza)"
                                                value={stop.stop_name}
                                                onChange={(e) => updateStop(idx, 'stop_name', e.target.value)}
                                                className="h-8"
                                            />
                                            <div className="flex gap-2">
                                                <Input
                                                    type="time"
                                                    value={stop.arrival_time || ''}
                                                    onChange={(e) => updateStop(idx, 'arrival_time', e.target.value)}
                                                    className="h-8 w-32"
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => removeStop(idx)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                                {formData.stops.length === 0 && (
                                    <div className="text-center py-4 border border-dashed rounded-lg text-xs text-muted-foreground">
                                        No stops added. Add stops to enable detailed tracking.
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">{editingRoute ? 'Update Route' : 'Create Route'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
